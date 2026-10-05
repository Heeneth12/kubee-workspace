// ---------- shared ----------
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

export interface PageResult<T> {
  content: T[];
  page: number;          // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
}

/** `data` of a 400 "Validation failed" response: field path -> message. */
export type ValidationErrors = Record<string, string>;

export type ItemType = 'GOODS' | 'SERVICE';
export type FoodType = 'VEG' | 'NON_VEG' | 'EGG';

// ---------- responses ----------
export interface Category {
  uuid: string;
  name: string;
  parentUuid: string | null;   // null = top-level
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  itemCount: number;           // non-deleted items directly in this category
}

export interface Item {
  uuid: string;
  name: string;
  shortName: string | null;    // printed on small thermal bills
  itemCode: string | null;     // quick-type code, e.g. "101"
  barcode: string | null;
  categoryUuid: string | null;
  categoryName: string | null;
  itemType: ItemType;
  foodType: FoodType | null;   // null for non-food shops
  unitOfMeasure: string;       // upper-case: PCS, PLATE, KG, CUP ...
  sellingPrice: number;        // = default variant price when hasVariants
  mrp: number | null;
  priceIncludesTax: boolean;
  taxGroupUuid: string | null; // null = not taxed
  taxGroupName: string | null;
  taxRate: number | null;      // e.g. 5 for GST 5%
  hsnSacCode: string | null;
  hasVariants: boolean;
  openPrice: boolean;          // cashier types the price while billing
  favourite: boolean;          // show as quick button on billing screen
  imageUrl: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;             // false = "not available", cannot be billed
  updatedAt: string;           // ISO local date-time
  variants: ItemVariant[];     // [] when hasVariants = false
  addonGroupUuids: string[];   // resolve via the add-on groups list
}

export interface ItemVariant {
  uuid: string;
  name: string;                // Half / Full, 250g ...
  itemCode: string | null;
  barcode: string | null;
  sellingPrice: number;
  mrp: number | null;
  isDefault: boolean;          // exactly one per item
  sortOrder: number;
  active: boolean;
}

/** Result of a barcode scan / typed code. */
export interface ItemLookup {
  matchedVariantUuid: string | null; // set when the code belonged to a variant: pre-select it
  item: Item;
}

export interface AddonGroup {
  uuid: string;
  name: string;
  minSelect: number;           // customer must pick at least this many
  maxSelect: number | null;    // null = no upper limit
  active: boolean;
  addons: Addon[];
}

export interface Addon {
  uuid: string;
  name: string;
  price: number;
  foodType: FoodType | null;
  sortOrder: number;
  active: boolean;
}

// ---------- requests ----------
export interface CategoryRequest {
  name: string;                // required, max 255, unique per parent (case-insensitive)
  parentUuid?: string | null;  // must be a top-level category (max 2 levels)
  imageUrl?: string | null;    // max 500
  sortOrder?: number;          // default 0
  active?: boolean;            // default true (create always makes it active)
}

/** Used for both create (POST) and full replace (PUT). Send the WHOLE item on PUT. */
export interface ItemRequest {
  name: string;                // required, max 255
  shortName?: string | null;   // max 50
  itemCode?: string | null;    // max 50, unique across items AND variants of the shop
  barcode?: string | null;     // max 100, unique across items AND variants of the shop
  categoryUuid?: string | null;
  itemType?: ItemType;         // default GOODS
  foodType?: FoodType | null;
  unitOfMeasure?: string | null; // max 20, default PCS, stored upper-case
  hsnSacCode?: string | null;  // 4-8 digits
  imageUrl?: string | null;    // max 500
  description?: string | null;
  sortOrder?: number;          // default 0
  sellingPrice?: number | null; // required unless openPrice or variants given; ignored when variants given
  mrp?: number | null;         // sellingPrice must be <= mrp
  priceIncludesTax?: boolean;  // default true
  taxGroupUuid?: string | null;
  openPrice?: boolean;         // default false; cannot be combined with variants
  favourite?: boolean;         // default false
  active?: boolean;            // default true
  variants?: VariantRequest[]; // default []  (see "upsert lists" below)
  addonGroupUuids?: string[];  // default []  (order = display order)
}

export interface VariantRequest {
  uuid?: string | null;        // omit for NEW variant; send existing uuid to KEEP/UPDATE it
  name: string;                // required, max 100, unique within the item
  itemCode?: string | null;
  barcode?: string | null;
  sellingPrice: number;        // required, >= 0
  mrp?: number | null;
  isDefault?: boolean;         // max one true; if none, first active variant becomes default
  sortOrder?: number;
  active?: boolean;            // default true; the default variant must be active
}

export interface AddonGroupRequest {
  name: string;                // required, max 100, unique (case-insensitive)
  minSelect?: number;          // default 0; must be <= number of active add-ons
  maxSelect?: number | null;   // null = no limit; >= 1 and >= minSelect
  active?: boolean;            // default true (used on update)
  addons?: AddonRequest[];     // upsert list, same rules as variants
}

export interface AddonRequest {
  uuid?: string | null;
  name: string;                // required, max 100, unique within the group
  price?: number | null;       // default 0, >= 0
  foodType?: FoodType | null;
  sortOrder?: number;
  active?: boolean;            // default true
}

export interface ItemSearchParams {
  search?: string;             // name contains, or exact item/variant code or barcode
  categoryUuid?: string;
  active?: boolean;
  favourite?: boolean;
  foodType?: FoodType;
  page?: number;               // default 0
  size?: number;               // default 50, max 500
}
