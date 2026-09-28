import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const shirts = await prisma.category.create({
    data: {
      slug: "shirts",
      name: "Shirts",
      tagline: "Crisp cuts for weekday to weekend",
      image: img("1596755094514-f87e34085b2c"),
    },
  });
  const pants = await prisma.category.create({
    data: {
      slug: "pants",
      name: "Pants",
      tagline: "Tailored, easy, never boring",
      image: img("1624378439575-d8705ad7ae80"),
    },
  });
  const shoes = await prisma.category.create({
    data: {
      slug: "shoes",
      name: "Shoes",
      tagline: "The finish that makes the outfit",
      image: img("1549298916-b41d501d3772"),
    },
  });
  const perfumes = await prisma.category.create({
    data: {
      slug: "perfumes",
      name: "Perfumes",
      tagline: "Signature scents, boutique prices",
      image: img("1541643600914-78b084683601"),
    },
  });
  const belts = await prisma.category.create({
    data: {
      slug: "belts",
      name: "Belts",
      tagline: "Quiet luxury, solid hardware",
      image: img("1553062407-98eeb64c6a62"),
    },
  });
  const outfits = await prisma.category.create({
    data: {
      slug: "outfits",
      name: "Branded outfits",
      tagline: "Full looks, ready to walk out in",
      image: img("1490481651871-ab68de25d43d"),
    },
  });

  await prisma.product.createMany({
    data: [
      {
        slug: "ivory-oxford-shirt",
        name: "Ivory Oxford Shirt",
        description:
          "A clean oxford with a soft collar and a drape that looks expensive without trying. Best price for a daily hero shirt.",
        price: 1899,
        compareAt: 2499,
        image: img("1596755094514-f87e34085b2c"),
        gallery: [img("1596755094514-f87e34085b2c"), img("1602810318383-e386cc2a3ccf")],
        sizes: ["S", "M", "L", "XL"],
        featured: true,
        categoryId: shirts.id,
      },
      {
        slug: "midnight-poplin-shirt",
        name: "Midnight Poplin Shirt",
        description:
          "Ink-black poplin that holds a crease and photographs like a campaign still. Pair with tailored pants and a slim belt.",
        price: 2199,
        image: img("1594938291221-94d3ab3124c4"),
        gallery: [img("1594938291221-94d3ab3124c4")],
        sizes: ["S", "M", "L", "XL", "XXL"],
        featured: true,
        categoryId: shirts.id,
      },
      {
        slug: "sand-linen-shirt",
        name: "Sand Linen Shirt",
        description:
          "Washed linen, open collar, vacation energy that still works under a blazer. Amazing collection staple.",
        price: 2499,
        image: img("1603252109303-2751441dd157"),
        gallery: [img("1603252109303-2751441dd157")],
        sizes: ["S", "M", "L", "XL"],
        featured: false,
        categoryId: shirts.id,
      },
      {
        slug: "stone-chinos",
        name: "Stone Stretch Chinos",
        description:
          "Tapered chinos with just enough stretch to sit, walk, and look sharp till midnight.",
        price: 2299,
        compareAt: 2999,
        image: img("1473966968600-fa801b869a1a"),
        gallery: [img("1473966968600-fa801b869a1a")],
        sizes: ["30", "32", "34", "36"],
        featured: true,
        categoryId: pants.id,
      },
      {
        slug: "ink-tailored-trousers",
        name: "Ink Tailored Trousers",
        description:
          "Pressed, slim, and serious. The pants you wear when the outfit has to do the talking.",
        price: 2799,
        image: img("1624378439575-d8705ad7ae80"),
        gallery: [img("1624378439575-d8705ad7ae80")],
        sizes: ["30", "32", "34", "36"],
        featured: false,
        categoryId: pants.id,
      },
      {
        slug: "wide-khaki-pants",
        name: "Wide Khaki Pants",
        description:
          "Relaxed wide-leg khaki with a high rise. Modern, easy, and made to stack with sneakers or loafers.",
        price: 2599,
        image: img("1506629082955-511b1aa562c8"),
        gallery: [img("1506629082955-511b1aa562c8")],
        sizes: ["30", "32", "34", "36"],
        featured: false,
        categoryId: pants.id,
      },
      {
        slug: "cognac-city-sneakers",
        name: "Cognac City Sneakers",
        description:
          "Leather sneakers in a warm cognac that dress up denim and cool down a suit. Best prices on a branded finish.",
        price: 3499,
        compareAt: 4299,
        image: img("1549298916-b41d501d3772"),
        gallery: [img("1549298916-b41d501d3772")],
        sizes: ["7", "8", "9", "10", "11"],
        featured: true,
        categoryId: shoes.id,
      },
      {
        slug: "onyx-runner",
        name: "Onyx Runner",
        description:
          "All-black runner with a quiet logo and a cushioned sole. Night-out energy, all-day comfort.",
        price: 3999,
        image: img("1542291026-7eec264c27ff"),
        gallery: [img("1542291026-7eec264c27ff")],
        sizes: ["7", "8", "9", "10", "11"],
        featured: true,
        categoryId: shoes.id,
      },
      {
        slug: "ivory-loafer",
        name: "Ivory Loafer",
        description:
          "A polished loafer that turns a simple shirt-and-pant into a branded outfit.",
        price: 3799,
        image: img("1533867616327-75c3b0059dbe"),
        gallery: [img("1533867616327-75c3b0059dbe")],
        sizes: ["7", "8", "9", "10"],
        featured: false,
        categoryId: shoes.id,
      },
      {
        slug: "noir-oud",
        name: "Noir Oud",
        description:
          "Smoked oud, cedar, and a hint of amber. A night perfume that lasts through dinner and the drive after.",
        price: 1899,
        image: img("1541643600914-78b084683601"),
        gallery: [img("1541643600914-78b084683601")],
        sizes: ["50ml", "100ml"],
        featured: true,
        categoryId: perfumes.id,
      },
      {
        slug: "white-vetiver",
        name: "White Vetiver",
        description:
          "Clean vetiver and bergamot. Office-safe, compliment-heavy, priced like we actually want you to smell good.",
        price: 1699,
        compareAt: 2199,
        image: img("1594035910387-fea47794263f"),
        gallery: [img("1594035910387-fea47794263f")],
        sizes: ["50ml", "100ml"],
        featured: false,
        categoryId: perfumes.id,
      },
      {
        slug: "rose-ember",
        name: "Rose Ember",
        description:
          "A modern rose with spice. Unisex, bold, and built for people who dress like they mean it.",
        price: 1999,
        image: img("1455659817273-fdf55d3220ad"),
        gallery: [img("1455659817273-fdf55d3220ad")],
        sizes: ["50ml", "100ml"],
        featured: false,
        categoryId: perfumes.id,
      },
      {
        slug: "italian-leather-belt",
        name: "Italian Leather Belt",
        description:
          "Full-grain leather, brushed gold buckle, and a slim profile that sits clean on tailored pants.",
        price: 1299,
        image: img("1553062407-98eeb64c6a62"),
        gallery: [img("1553062407-98eeb64c6a62")],
        sizes: ["32", "34", "36", "38"],
        featured: true,
        categoryId: belts.id,
      },
      {
        slug: "matte-black-belt",
        name: "Matte Black Belt",
        description:
          "Black-on-black hardware. The quiet piece that makes a branded outfit look finished.",
        price: 1199,
        image: img("1624222247344-550fb60583c2"),
        gallery: [img("1624222247344-550fb60583c2")],
        sizes: ["32", "34", "36", "38"],
        featured: false,
        categoryId: belts.id,
      },
      {
        slug: "city-edit-look",
        name: "City Edit Look",
        description:
          "Shirt, tailored pant and belt — a ready branded outfit for meetings, dinners, and everything between.",
        price: 6499,
        compareAt: 7999,
        image: img("1490481651871-ab68de25d43d"),
        gallery: [img("1490481651871-ab68de25d43d"), img("1483985988355-763728e1935b")],
        sizes: ["S", "M", "L", "XL"],
        featured: true,
        categoryId: outfits.id,
      },
      {
        slug: "after-hours-look",
        name: "After Hours Look",
        description:
          "Dark shirt, ink trousers, and a silhouette that reads luxury from across the room.",
        price: 7299,
        image: img("1539103385448-5c9c23d90d91"),
        gallery: [img("1539103385448-5c9c23d90d91")],
        sizes: ["S", "M", "L", "XL"],
        featured: true,
        categoryId: outfits.id,
      },
      {
        slug: "weekend-runway-look",
        name: "Weekend Runway Look",
        description:
          "Relaxed layers with a branded edge. The outfit you wear when the city is the campaign.",
        price: 5999,
        image: img("1515886657613-9f3515b0c78f"),
        gallery: [img("1515886657613-9f3515b0c78f")],
        sizes: ["S", "M", "L", "XL"],
        featured: false,
        categoryId: outfits.id,
      },
    ],
  });

  console.log("BMS Fashionz catalog seeded");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
