export type VoiceAction = "SALE" | "PURCHASE" | "UNKNOWN";

export type VoiceCommandItem = {
  productId: number | null;
  productName: string;
  quantity: number;
  unitAmount: number | null;
};

export type VoiceCommand = {
  action: VoiceAction;
  customerName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  items: VoiceCommandItem[];
  missingFields: string[];
};
