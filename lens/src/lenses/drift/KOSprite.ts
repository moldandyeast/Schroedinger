import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';
import { Spring2D } from './spring';
import type { KO, KOPhysics, Traits } from '../../core';

/**
 * Visual representation of a Knowledge Object on the canvas
 */
export class KOSprite extends Container {
  public koId: string;
  
  private ko: KO;
  private physics: KOPhysics;
  private traits: Traits;
  
  private bg: Graphics;
  private titleText: Text;
  private typeIndicator: Graphics;
  
  private spring: Spring2D;
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  
  private shimmerPhase: number = Math.random() * Math.PI * 2;
  private sparkTimer: number = 0;
  private glowGraphics: Graphics | null = null;
  private isGlowing: boolean = false;
  private glowIntensity: number = 0;
  
  // Callbacks
  public onDragStart?: (sprite: KOSprite) => void;
  public onDragMove?: (sprite: KOSprite, x: number, y: number) => void;
  public onDragEnd?: (sprite: KOSprite, x: number, y: number) => void;
  public onHover?: (sprite: KOSprite, isHovered: boolean) => void;
  public onClick?: (sprite: KOSprite) => void;

  constructor(ko: KO, physics: KOPhysics, traits: Traits = {}) {
    super();
    
    this.koId = ko.id;
    this.ko = ko;
    this.physics = physics;
    this.traits = traits;
    
    // Initialize spring at physics position
    this.spring = new Spring2D(physics.position_x, physics.position_y, 120, 20);
    
    // Create background
    this.bg = new Graphics();
    this.addChild(this.bg);
    
    // Create type indicator
    this.typeIndicator = new Graphics();
    this.addChild(this.typeIndicator);
    
    // Create title
    this.titleText = new Text({
      text: this.truncateTitle(ko.title),
      style: {
        fontFamily: 'Literata, Georgia, serif',
        fontSize: 14,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 170,
      },
    });
    this.titleText.x = 12;
    this.titleText.y = 12;
    this.addChild(this.titleText);
    
    // Create glow graphics (behind everything)
    this.glowGraphics = new Graphics();
    this.addChildAt(this.glowGraphics, 0);
    
    // Initial draw
    this.draw();
    
    // Position
    this.x = physics.position_x;
    this.y = physics.position_y;
    this.pivot.set(100, 40); // Center the sprite
    
    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'grab';
    
    // Event handlers
    this.on('pointerdown', this.handlePointerDown, this);
    this.on('pointerup', this.handlePointerUp, this);
    this.on('pointerupoutside', this.handlePointerUp, this);
    this.on('pointermove', this.handlePointerMove, this);
    this.on('pointerover', this.handlePointerOver, this);
    this.on('pointerout', this.handlePointerOut, this);
  }

  private truncateTitle(title: string): string {
    if (title.length > 40) {
      return title.slice(0, 37) + '...';
    }
    return title;
  }

  private draw(): void {
    const alpha = this.calculateAlpha();
    const borderColor = this.getBorderColor();
    
    // Clear and redraw background
    this.bg.clear();
    
    // Main card background
    this.bg.roundRect(0, 0, 200, 80, 8);
    this.bg.fill({ color: 0x1a1a1a, alpha: alpha * 0.95 });
    this.bg.stroke({ color: borderColor, width: this.traits.ancient ? 2 : 1, alpha });
    
    // Type indicator
    this.typeIndicator.clear();
    const typeColor = this.getTypeColor();
    this.typeIndicator.circle(190, 10, 4);
    this.typeIndicator.fill({ color: typeColor, alpha });
    
    // Update title alpha
    this.titleText.alpha = alpha;
  }

  private calculateAlpha(): number {
    let alpha = 1 - this.physics.entropy * 0.4;
    
    if (this.traits.forgotten) {
      alpha *= 0.4;
    }
    
    return Math.max(0.3, Math.min(1, alpha));
  }

  private getBorderColor(): number {
    if (this.traits.ancient) return 0xd4af37; // Gold
    if (this.traits.magnetic) return 0x4488ff; // Blue glow
    if (this.traits.volatile) return 0xff4444; // Red
    return 0x333333; // Default gray
  }

  private getTypeColor(): number {
    switch (this.ko.type) {
      case 'synthesis': return 0x44ff88;
      case 'observation': return 0xffaa44;
      default: return 0x666666;
    }
  }

  /**
   * Update the sprite (called every frame)
   */
  update(dt: number): void {
    // Update shimmer for high-entropy objects
    if (this.physics.entropy > 0.5 && !this.isDragging) {
      this.shimmerPhase += dt * 0.003;
      const shimmer = Math.sin(this.shimmerPhase) * this.physics.entropy * 2;
      this.x = this.spring.x.current + shimmer;
      this.y = this.spring.y.current + shimmer * 0.7;
    } else if (!this.isDragging) {
      // Normal spring update
      const pos = this.spring.update(dt);
      this.x = pos.x;
      this.y = pos.y;
    }
    
    // Volatile sparks
    if (this.traits.volatile) {
      this.sparkTimer -= dt;
      if (this.sparkTimer <= 0) {
        this.emitSpark();
        this.sparkTimer = 500 + Math.random() * 2000;
      }
    }
    
    // Restless micro-movements
    if (this.traits.restless && !this.isDragging) {
      this.rotation = Math.sin(Date.now() * 0.005) * 0.02;
    } else {
      this.rotation *= 0.9; // Settle back to 0
    }
    
    // Update glow
    if (this.isGlowing && this.glowIntensity < 1) {
      this.glowIntensity = Math.min(1, this.glowIntensity + dt * 0.005);
      this.drawGlow();
    } else if (!this.isGlowing && this.glowIntensity > 0) {
      this.glowIntensity = Math.max(0, this.glowIntensity - dt * 0.01);
      this.drawGlow();
    }
  }
  
  /**
   * Enable/disable glow effect
   */
  setGlow(enabled: boolean): void {
    this.isGlowing = enabled;
  }
  
  private drawGlow(): void {
    if (!this.glowGraphics) return;
    
    this.glowGraphics.clear();
    
    if (this.glowIntensity <= 0) return;
    
    // Draw multiple layers for glow effect
    const glowColor = this.traits.ancient ? 0xd4af37 : 
                      this.traits.magnetic ? 0x4488ff : 
                      0x44ff88;
    
    for (let i = 3; i >= 1; i--) {
      const size = 8 * i;
      const alpha = this.glowIntensity * 0.1 / i;
      
      this.glowGraphics.roundRect(-size, -size, 200 + size * 2, 80 + size * 2, 8 + size);
      this.glowGraphics.fill({ color: glowColor, alpha });
    }
  }

  private emitSpark(): void {
    // Create a small spark effect
    const spark = new Graphics();
    spark.circle(0, 0, 2);
    spark.fill({ color: 0xffaa00, alpha: 0.8 });
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    spark.x = 100 + Math.cos(angle) * 20;
    spark.y = 40 + Math.sin(angle) * 20;
    
    this.addChild(spark);
    
    // Animate and remove
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 300) {
        this.removeChild(spark);
        return;
      }
      
      const progress = elapsed / 300;
      spark.x += Math.cos(angle) * 2;
      spark.y += Math.sin(angle) * 2;
      spark.alpha = 1 - progress;
      spark.scale.set(1 - progress * 0.5);
      
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Update the target position (from physics engine)
   */
  setTargetPosition(x: number, y: number): void {
    if (!this.isDragging) {
      this.spring.setTarget(x, y);
    }
  }

  /**
   * Update KO data
   */
  updateKO(ko: KO): void {
    this.ko = ko;
    this.titleText.text = this.truncateTitle(ko.title);
    this.draw();
  }

  /**
   * Update physics data
   */
  updatePhysics(physics: KOPhysics): void {
    this.physics = physics;
    this.setTargetPosition(physics.position_x, physics.position_y);
    this.draw();
  }

  /**
   * Update traits
   */
  updateTraits(traits: Traits): void {
    this.traits = traits;
    this.draw();
  }

  // ============ Event Handlers ============

  private handlePointerDown(event: FederatedPointerEvent): void {
    this.isDragging = true;
    this.cursor = 'grabbing';
    this.alpha = 0.9;
    
    const globalPos = event.global;
    this.dragOffset = {
      x: globalPos.x - this.x,
      y: globalPos.y - this.y,
    };
    
    this.onDragStart?.(this);
  }

  private handlePointerUp(event: FederatedPointerEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.cursor = 'grab';
      this.alpha = 1;
      
      // Update spring to current position
      this.spring.set(this.x, this.y);
      
      this.onDragEnd?.(this, this.x, this.y);
    }
  }

  private handlePointerMove(event: FederatedPointerEvent): void {
    if (this.isDragging) {
      const globalPos = event.global;
      this.x = globalPos.x - this.dragOffset.x;
      this.y = globalPos.y - this.dragOffset.y;
      
      this.onDragMove?.(this, this.x, this.y);
    }
  }

  private handlePointerOver(): void {
    if (!this.isDragging) {
      this.scale.set(1.02);
    }
    this.onHover?.(this, true);
  }

  private handlePointerOut(): void {
    if (!this.isDragging) {
      this.scale.set(1);
    }
    this.onHover?.(this, false);
  }
}

