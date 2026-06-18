export const demoContext = {
  store: {
    name: "Flowmark Gear",
    currency: "$",
  },
  title: "Inventory Dashboard",
  description:
    "A server-rendered product catalog built with Flowmark control flow inside Astro.",
  featured: true,
  products: [
    {
      id: 1,
      name: "Ergonomic Keyboard",
      description: "A comfortable keyboard for long coding sessions.",
      status: "available",
      price: 129,
      category: "Peripherals",
      stock: 12,
    },
    {
      id: 2,
      name: "Wireless Mouse",
      description: "Precision mouse with a long battery life.",
      status: "sale",
      price: 59,
      category: "Peripherals",
      stock: 4,
    },
    {
      id: 3,
      name: "Mechanical Keycaps",
      description: "Custom keycaps for your favorite switches.",
      status: "unavailable",
      price: 39,
      category: "Accessories",
      stock: 0,
    },
    {
      id: 4,
      name: "USB-C Dock",
      description: "Expand your laptop with 6 ports.",
      status: "available",
      price: 89,
      category: "Accessories",
      stock: 7,
    },
  ],
  notes: [
    {
      title: "Template source is trusted code",
      body: "Expressions are emitted as JavaScript. Context values are escaped when interpolated.",
    },
    {
      title: "`track` is reserved syntax",
      body: "It is parsed today, but string rendering has no DOM diffing step where keys would matter.",
    },
    {
      title: "Plain JavaScript expressions",
      body: "You can use `.filter`, `.length`, and any other JS expression inside interpolations.",
    },
  ],
};
