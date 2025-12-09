import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { Solution, SolutionRequirements, N8nWorkflow, N8nNode } from './models/workflow.model';
import { TranslationService, AppTranslations } from './services/translation.service';

interface Platforms {
  web: boolean;
  mobile: boolean;
  desktop: boolean;
}

type InteractionState = 
  | { mode: 'none' }
  | { mode: 'panning' }
  | { mode: 'draggingNode', nodeId: string, offsetX: number, offsetY: number }
  | { mode: 'connecting', startNodeId: string, startPort: {x: number, y: number} };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  private translationService = inject(TranslationService);

  // App state signals
  isLoading = signal(false);
  error = signal<string | null>(null);
  solutionResult = signal<Solution | null>(null);
  isApiConfigured = signal(this.geminiService.isConfigured());

  // n8n workflow state signals
  n8nWorkflow = signal<N8nWorkflow | null>(null);
  isGeneratingWorkflow = signal(false);
  workflowError = signal<string | null>(null);
  isWorkflowVisible = signal(false);
  
  // Interactive canvas state signals
  zoomLevel = signal(1);
  panOffset = signal({ x: 0, y: 0 });
  interactionState = signal<InteractionState>({ mode: 'none' });
  connectionPreviewEnd = signal<{x: number, y: number} | null>(null);
  editingNode = signal<N8nNode | null>(null);

  // Computed value for quick node lookups
  nodeMap = computed(() => {
    const map = new Map<string, N8nNode>();
    this.n8nWorkflow()?.nodes.forEach(node => map.set(node.id, node));
    return map;
  });
  
  // Computed values for rendering connections
  connections = computed(() => {
    const workflow = this.n8nWorkflow();
    if (!workflow) return [];
    const nodeMap = this.nodeMap();

    return workflow.nodes.flatMap(startNode =>
      startNode.outputs.map(endNodeId => {
        const endNode = nodeMap.get(endNodeId);
        if (!endNode) return null;
        const startPos = { x: startNode.position.x + 288, y: startNode.position.y + 72 };
        const endPos = { x: endNode.position.x, y: endNode.position.y + 72 };
        return this.getSvgPath(startPos, endPos);
      }).filter((p): p is string => p !== null)
    );
  });

  connectionPreviewPath = computed(() => {
    const state = this.interactionState();
    const previewEnd = this.connectionPreviewEnd();
    if (state.mode !== 'connecting' || !previewEnd) return null;
    return this.getSvgPath(state.startPort, previewEnd);
  });

  canvasTransform = computed(() => `scale(${this.zoomLevel()}) translate(${this.panOffset().x}px, ${this.panOffset().y}px)`);
  
  private getSvgPath(startPos: {x: number, y: number}, endPos: {x: number, y: number}): string {
    const dx = endPos.x - startPos.x;
    const handleOffset = Math.max(50, Math.abs(dx) * 0.5);
    return `M ${startPos.x} ${startPos.y} C ${startPos.x + handleOffset} ${startPos.y}, ${endPos.x - handleOffset} ${endPos.y}, ${endPos.x} ${endPos.y}`;
  }

  constructor() {
    effect(() => {
      // Prevent body scrolling when the full-screen workflow is visible
      if (this.isWorkflowVisible()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  // Language state
  currentLang = signal<'zh' | 'en'>('zh');
  translations = computed<AppTranslations>(() => 
    this.translationService.getTranslations(this.currentLang())
  );

  // Form state signals
  businessType = signal(this.translations().form.defaultBusinessType);
  keyFeatures = signal(this.translations().form.defaultKeyFeatures);
  targetUsers = signal(this.translations().form.defaultTargetUsers);
  platforms = signal<Platforms>({ web: true, mobile: true, desktop: false });

  allPlatforms = computed(() => [
    { id: 'web', name: this.translations().platforms.web },
    { id: 'mobile', name: this.translations().platforms.mobile },
    { id: 'desktop', name: this.translations().platforms.desktop },
  ] as const);

  updateInput(field: 'businessType' | 'keyFeatures' | 'targetUsers', event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this[field].set(target.value);
  }

  togglePlatform(platformKey: keyof Platforms) {
    this.platforms.update(current => ({ ...current, [platformKey]: !current[platformKey] }));
  }
  
  setLanguage(lang: 'zh' | 'en') {
    if (this.currentLang() === lang) return;
    this.currentLang.set(lang);
    this.businessType.set(this.translations().form.defaultBusinessType);
    this.keyFeatures.set(this.translations().form.defaultKeyFeatures);
    this.targetUsers.set(this.translations().form.defaultTargetUsers);
    this.solutionResult.set(null);
    this.error.set(null);
    this.closeWorkflowView();
  }

  async generateSolution() {
    if (!this.keyFeatures().trim() || !this.businessType().trim()) {
      this.error.set(this.translations().errors.missingFields); return;
    }
    const selectedPlatforms = Object.entries(this.platforms()).filter(([, v]) => v).map(([k]) => k);
    if (selectedPlatforms.length === 0) {
      this.error.set(this.translations().errors.missingPlatform); return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.solutionResult.set(null);
    this.closeWorkflowView();
    const requirements: SolutionRequirements = {
      businessType: this.businessType(),
      keyFeatures: this.keyFeatures(),
      targetUsers: this.targetUsers(),
      platforms: selectedPlatforms,
    };
    try {
      const result = await this.geminiService.generateSolution(requirements, this.currentLang());
      this.solutionResult.set(result);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateN8nWorkflow() {
    const solution = this.solutionResult();
    if (!solution) return;
    this.isGeneratingWorkflow.set(true);
    this.workflowError.set(null);
    this.n8nWorkflow.set(null);
    try {
      const result = await this.geminiService.generateN8nWorkflow(solution, this.currentLang());
      this.n8nWorkflow.set(result);
      this.resetView();
      this.isWorkflowVisible.set(true);
    } catch (e: unknown) {
      this.workflowError.set(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      this.isGeneratingWorkflow.set(false);
    }
  }

  closeWorkflowView() {
    this.isWorkflowVisible.set(false);
    this.n8nWorkflow.set(null);
    this.workflowError.set(null);
  }

  // --- Interactive Canvas Methods ---
  zoom(factor: number) {
    this.zoomLevel.update(level => Math.max(0.2, Math.min(level * factor, 2)));
  }

  resetView() {
    this.zoomLevel.set(0.8);
    this.panOffset.set({ x: 50, y: 150 });
  }

  onCanvasWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoom(zoomFactor);
  }
  
  // --- Canvas Interaction State Machine ---
  onCanvasMouseDown(event: MouseEvent, container: HTMLDivElement) {
    if (event.button !== 0 || this.editingNode()) return;
    const target = event.target as HTMLElement;
    
    if (target.closest('.port-output')) {
      const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id');
      if (!nodeId) return;
      const node = this.nodeMap().get(nodeId);
      if (!node) return;
      this.interactionState.set({ 
        mode: 'connecting', 
        startNodeId: nodeId,
        startPort: { x: node.position.x + 288, y: node.position.y + 72 }
      });
      this.updatePreviewEnd(event, container);
    } else if (target.closest('.node-body')) {
      const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id');
      if (!nodeId) return;
      const node = this.nodeMap().get(nodeId)!;
      this.interactionState.set({ 
        mode: 'draggingNode', 
        nodeId: nodeId,
        offsetX: event.clientX / this.zoomLevel() - node.position.x,
        offsetY: event.clientY / this.zoomLevel() - node.position.y
      });
    } else {
      this.interactionState.set({ mode: 'panning' });
    }
  }

  onCanvasMouseMove(event: MouseEvent, container: HTMLDivElement) {
    const state = this.interactionState();
    switch (state.mode) {
      case 'panning':
        this.panOffset.update(offset => ({
          x: offset.x + event.movementX / this.zoomLevel(),
          y: offset.y + event.movementY / this.zoomLevel(),
        }));
        break;
      case 'draggingNode':
        const newX = event.clientX / this.zoomLevel() - state.offsetX;
        const newY = event.clientY / this.zoomLevel() - state.offsetY;
        this.n8nWorkflow.update(wf => {
          const node = wf!.nodes.find(n => n.id === state.nodeId);
          if (node) {
            node.position.x = newX;
            node.position.y = newY;
          }
          return { ...wf! };
        });
        break;
      case 'connecting':
        this.updatePreviewEnd(event, container);
        break;
    }
  }

  onCanvasMouseUp(event: MouseEvent) {
    const state = this.interactionState();
    if (state.mode === 'connecting') {
      const target = event.target as HTMLElement;
      const endPort = target.closest('.port-input');
      const endNodeEl = endPort?.closest('[data-node-id]');
      if (endNodeEl) {
        const endNodeId = endNodeEl.getAttribute('data-node-id');
        if (endNodeId && endNodeId !== state.startNodeId) {
          this.n8nWorkflow.update(wf => {
            const startNode = wf!.nodes.find(n => n.id === state.startNodeId);
            if (startNode && !startNode.outputs.includes(endNodeId)) {
              startNode.outputs.push(endNodeId);
            }
            return { ...wf! };
          });
        }
      }
    }
    this.interactionState.set({ mode: 'none' });
    this.connectionPreviewEnd.set(null);
  }

  private updatePreviewEnd(event: MouseEvent, container: HTMLDivElement) {
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.zoomLevel() - this.panOffset().x;
    const y = (event.clientY - rect.top) / this.zoomLevel() - this.panOffset().y;
    this.connectionPreviewEnd.set({ x, y });
  }

  // --- Node Editing ---
  startNodeEdit(nodeToEdit: N8nNode) {
    // Create a deep copy to avoid mutating the original state while editing.
    this.editingNode.set(JSON.parse(JSON.stringify(nodeToEdit)));
  }

  cancelNodeEdit() {
    this.editingNode.set(null);
  }

  saveNodeEdit() {
    const editedNode = this.editingNode();
    if (!editedNode) return;

    this.n8nWorkflow.update(currentWorkflow => {
      if (!currentWorkflow) return null;

      const newNodes = currentWorkflow.nodes.map(node => {
        if (node.id === editedNode.id) {
          // Return a new object combining the old node's non-editable properties
          // with the edited ones from the modal.
          return { 
            ...node, 
            name: editedNode.name, 
            type: editedNode.type, 
            description: editedNode.description 
          };
        }
        return node;
      });

      return { ...currentWorkflow, nodes: newNodes };
    });

    this.editingNode.set(null); // Close the modal
  }
}
