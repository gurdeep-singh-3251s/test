export type OccasionId = "wedding" | "casual" | "birthday" | "club" | "gedi" | "office";

export type OutfitStep = {
  key: string;
  title: string;
  hint: string;
  optional?: boolean;
  productIds: string[];
};

export const occasions: {
  id: OccasionId;
  name: string;
  line: string;
  steps: OutfitStep[];
}[] = [
  {
    id: "wedding",
    name: "Wedding",
    line: "Guest, sagan, or the function after.",
    steps: [
      { key: "shirt", title: "Shirt", hint: "Start with a clean shirt.", productIds: ["prod_ivory-oxford-shirt", "prod_midnight-poplin-shirt"] },
      { key: "blazer", title: "Blazer", hint: "Optional. Skip if you want it lighter.", optional: true, productIds: ["prod_navy-blazer"] },
      { key: "pants", title: "Pants", hint: "Formal trousers or a sharp chino.", productIds: ["prod_ink-tailored-trousers", "prod_stone-chinos"] },
      { key: "neck", title: "Tie or bow", hint: "Optional finish.", optional: true, productIds: ["prod_navy-silk-tie", "prod_black-bow-tie"] },
      { key: "shoes", title: "Shoes", hint: "A loafer or a quiet sneaker.", productIds: ["prod_ivory-loafer", "prod_cognac-city-sneakers"] },
      { key: "belt", title: "Belt", hint: "Match the shoes.", productIds: ["prod_italian-leather-belt", "prod_matte-black-belt"] },
      { key: "perfume", title: "Perfume", hint: "Last step.", productIds: ["prod_noir-oud", "prod_white-vetiver", "prod_rose-ember"] },
    ],
  },
  {
    id: "casual",
    name: "Casual",
    line: "Market, coffee, easy day.",
    steps: [
      { key: "top", title: "Shirt or t-shirt", hint: "Keep it easy.", productIds: ["prod_graphite-tee", "prod_sand-linen-shirt", "prod_ivory-oxford-shirt"] },
      { key: "pants", title: "Pants or jeans", hint: "Chinos, khaki or jeans.", productIds: ["prod_stone-chinos", "prod_wide-khaki-pants", "prod_dark-wash-jeans"] },
      { key: "shoes", title: "Shoes", hint: "Sneakers win here.", productIds: ["prod_cognac-city-sneakers", "prod_onyx-runner"] },
      { key: "belt", title: "Belt", hint: "Optional.", optional: true, productIds: ["prod_italian-leather-belt", "prod_matte-black-belt"] },
      { key: "perfume", title: "Perfume", hint: "A light finish.", productIds: ["prod_white-vetiver", "prod_rose-ember"] },
    ],
  },
  {
    id: "birthday",
    name: "Birthday",
    line: "Dinner, cake, photos.",
    steps: [
      { key: "shirt", title: "Shirt", hint: "Something that photographs well.", productIds: ["prod_midnight-poplin-shirt", "prod_sand-linen-shirt", "prod_ivory-oxford-shirt"] },
      { key: "pants", title: "Pants", hint: "Tailored or chino.", productIds: ["prod_ink-tailored-trousers", "prod_stone-chinos"] },
      { key: "shoes", title: "Shoes", hint: "Lift the look.", productIds: ["prod_ivory-loafer", "prod_cognac-city-sneakers"] },
      { key: "belt", title: "Belt", hint: "Small detail, big finish.", productIds: ["prod_italian-leather-belt", "prod_matte-black-belt"] },
      { key: "perfume", title: "Perfume", hint: "They will notice.", productIds: ["prod_rose-ember", "prod_noir-oud"] },
    ],
  },
  {
    id: "club",
    name: "Club",
    line: "Night out. Dark and sharp.",
    steps: [
      { key: "shirt", title: "Shirt", hint: "Go dark.", productIds: ["prod_midnight-poplin-shirt", "prod_graphite-tee"] },
      { key: "pants", title: "Pants or jeans", hint: "Ink trousers or dark jeans.", productIds: ["prod_ink-tailored-trousers", "prod_dark-wash-jeans"] },
      { key: "shoes", title: "Shoes", hint: "Black runner or cognac sneaker.", productIds: ["prod_onyx-runner", "prod_cognac-city-sneakers"] },
      { key: "belt", title: "Belt", hint: "Black hardware.", productIds: ["prod_matte-black-belt"] },
      { key: "perfume", title: "Perfume", hint: "Something that lasts.", productIds: ["prod_noir-oud", "prod_rose-ember"] },
    ],
  },
  {
    id: "gedi",
    name: "Gedi",
    line: "Car, music, the long road.",
    steps: [
      { key: "top", title: "T-shirt or shirt", hint: "Comfort first.", productIds: ["prod_graphite-tee", "prod_sand-linen-shirt"] },
      { key: "pants", title: "Jeans or khaki", hint: "Sit easy.", productIds: ["prod_dark-wash-jeans", "prod_wide-khaki-pants"] },
      { key: "shoes", title: "Shoes", hint: "Sneakers only.", productIds: ["prod_onyx-runner", "prod_cognac-city-sneakers"] },
      { key: "belt", title: "Belt", hint: "Optional.", optional: true, productIds: ["prod_matte-black-belt", "prod_italian-leather-belt"] },
      { key: "perfume", title: "Perfume", hint: "For the car.", productIds: ["prod_rose-ember", "prod_white-vetiver"] },
    ],
  },
  {
    id: "office",
    name: "Office",
    line: "Meetings, clients, clean lines.",
    steps: [
      { key: "shirt", title: "Shirt", hint: "Oxford or poplin.", productIds: ["prod_ivory-oxford-shirt", "prod_midnight-poplin-shirt"] },
      { key: "blazer", title: "Blazer", hint: "Optional if the office is strict.", optional: true, productIds: ["prod_navy-blazer"] },
      { key: "pants", title: "Formal pants", hint: "Pressed trousers.", productIds: ["prod_ink-tailored-trousers", "prod_stone-chinos"] },
      { key: "neck", title: "Tie", hint: "Optional.", optional: true, productIds: ["prod_navy-silk-tie"] },
      { key: "shoes", title: "Shoes", hint: "Loafer or clean sneaker.", productIds: ["prod_ivory-loafer", "prod_cognac-city-sneakers"] },
      { key: "belt", title: "Belt", hint: "Match the shoes.", productIds: ["prod_italian-leather-belt", "prod_matte-black-belt"] },
      { key: "perfume", title: "Perfume", hint: "Office-safe.", productIds: ["prod_white-vetiver", "prod_noir-oud"] },
    ],
  },
];

export const buildingLines = [
  "Looking at shirts",
  "Checking pants and jeans",
  "Matching shoes",
  "Picking a belt",
  "Finding a perfume",
  "Putting the look together",
];
