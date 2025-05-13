// components/chat/MiniProductDetails.jsx
import React from "react";
import Currency from "@/components/global/CurrencySymbol";

export default function MiniProductDetails({ data }) {
  const prices = (data.priceRanges || []).map((r) => parseFloat(r.price));
  const lowest = prices.length ? Math.min(...prices) : 0;
  const highest = prices.length ? Math.max(...prices) : 0;

  return (
    <div className='space-y-2 text-sm'>
      <img
        src={data.mainImageUrl}
        alt={
          typeof data.productName === "string"
            ? data.productName
            : data.productName.en
        }
        className='w-full h-auto rounded'
      />
      <p className='font-medium'>
        {typeof data.productName === "string"
          ? data.productName
          : data.productName.en}
      </p>
      <p className='text-xs text-gray-500'>
        Supplier: <span className='font-medium'>{data.supplierName}</span>
      </p>
      {prices.length ? (
        <p className='text-lg font-bold'>
          <Currency amount={lowest} /> – <Currency amount={highest} />
        </p>
      ) : (
        <p className='italic text-[#2c6449]'>Price negotiable</p>
      )}
    </div>
  );
}
