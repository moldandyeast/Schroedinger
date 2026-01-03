/**
 * Simple spring physics for smooth animations
 */
export class Spring {
  current: number;
  target: number;
  velocity: number = 0;
  stiffness: number;
  damping: number;
  precision: number;

  constructor(
    initial: number = 0,
    stiffness: number = 170,
    damping: number = 26,
    precision: number = 0.01
  ) {
    this.current = initial;
    this.target = initial;
    this.stiffness = stiffness;
    this.damping = damping;
    this.precision = precision;
  }

  /**
   * Update the spring physics
   * @param dt Delta time in milliseconds
   * @returns Current value
   */
  update(dt: number): number {
    const dtSeconds = dt / 1000;
    
    // Spring force
    const springForce = (this.target - this.current) * this.stiffness;
    
    // Damping force
    const dampingForce = this.velocity * this.damping;
    
    // Acceleration
    const acceleration = springForce - dampingForce;
    
    // Update velocity and position
    this.velocity += acceleration * dtSeconds;
    this.current += this.velocity * dtSeconds;
    
    // Snap to target if close enough
    if (
      Math.abs(this.target - this.current) < this.precision &&
      Math.abs(this.velocity) < this.precision
    ) {
      this.current = this.target;
      this.velocity = 0;
    }
    
    return this.current;
  }

  /**
   * Set the target value
   */
  setTarget(value: number): void {
    this.target = value;
  }

  /**
   * Jump to a value immediately
   */
  set(value: number): void {
    this.current = value;
    this.target = value;
    this.velocity = 0;
  }

  /**
   * Check if the spring is at rest
   */
  isAtRest(): boolean {
    return (
      this.current === this.target &&
      this.velocity === 0
    );
  }
}

/**
 * 2D Spring for position animations
 */
export class Spring2D {
  x: Spring;
  y: Spring;

  constructor(
    initialX: number = 0,
    initialY: number = 0,
    stiffness: number = 170,
    damping: number = 26
  ) {
    this.x = new Spring(initialX, stiffness, damping);
    this.y = new Spring(initialY, stiffness, damping);
  }

  update(dt: number): { x: number; y: number } {
    return {
      x: this.x.update(dt),
      y: this.y.update(dt),
    };
  }

  setTarget(x: number, y: number): void {
    this.x.setTarget(x);
    this.y.setTarget(y);
  }

  set(x: number, y: number): void {
    this.x.set(x);
    this.y.set(y);
  }

  isAtRest(): boolean {
    return this.x.isAtRest() && this.y.isAtRest();
  }

  get current(): { x: number; y: number } {
    return { x: this.x.current, y: this.y.current };
  }
}

