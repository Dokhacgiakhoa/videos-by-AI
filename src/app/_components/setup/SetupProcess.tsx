"use client";

import { ApiSetup } from "./ApiSetup";
import { IdeaDataSetup } from "./IdeaDataSetup";
import { ProductFormatSetup } from "./ProductFormatSetup";
import { BrandSetup } from "./BrandSetup";
import { GenerateSetup } from "./GenerateSetup";

export function SetupProcess() {
  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
      <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-hot" /> THIẾT LẬP
      </h2>
      
      <ApiSetup />
      <IdeaDataSetup />
      <ProductFormatSetup />
      <BrandSetup />
      <GenerateSetup />
    </div>
  );
}
