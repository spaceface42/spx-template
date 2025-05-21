export class Quadtree {
  constructor(boundary, capacity = 4) {
    this.boundary = boundary; // { x, y, w, h }
    this.capacity = capacity;
    this.items = [];
    this.divided = false;
  }

  insert(item) {
    if (!this.contains(this.boundary, item)) return false;

    if (this.items.length < this.capacity) {
      this.items.push(item);
      return true;
    }

    if (!this.divided) this.subdivide();

    return (
      this.northeast.insert(item) ||
      this.northwest.insert(item) ||
      this.southeast.insert(item) ||
      this.southwest.insert(item)
    );
  }

  query(range, found = []) {
    if (!this.intersects(this.boundary, range)) return found;

    for (let item of this.items) {
      if (this.intersects(item, range)) found.push(item);
    }

    if (this.divided) {
      this.northwest.query(range, found);
      this.northeast.query(range, found);
      this.southwest.query(range, found);
      this.southeast.query(range, found);
    }

    return found;
  }

  subdivide() {
    const { x, y, w, h } = this.boundary;
    const hw = w / 2, hh = h / 2;

    this.northwest = new Quadtree({ x, y, w: hw, h: hh }, this.capacity);
    this.northeast = new Quadtree({ x: x + hw, y, w: hw, h: hh }, this.capacity);
    this.southwest = new Quadtree({ x, y: y + hh, w: hw, h: hh }, this.capacity);
    this.southeast = new Quadtree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.capacity);

    this.divided = true;
  }

  contains(boundary, item) {
    return (
      item.x >= boundary.x &&
      item.y >= boundary.y &&
      item.x + item.w <= boundary.x + boundary.w &&
      item.y + item.h <= boundary.y + boundary.h
    );
  }

  intersects(a, b) {
    return !(
      b.x > a.x + a.w ||
      b.x + b.w < a.x ||
      b.y > a.y + a.h ||
      b.y + b.h < a.y
    );
  }
}
