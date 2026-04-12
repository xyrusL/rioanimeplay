"use client";

import { useEffect, useState } from "react";

import { CustomSelect } from "@/shared/ui/custom-select";

type AdminSelectFieldProps = {
  label: string;
  name: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  value: string;
};

export function AdminSelectField({
  label,
  name,
  options,
  value
}: AdminSelectFieldProps) {
  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  return (
    <div className="space-y-1.5">
      <CustomSelect
        label={label}
        value={selectedValue}
        options={options}
        onChange={setSelectedValue}
        className="w-full"
        menuClassName="bg-[#15161d]"
      />
      <input type="hidden" name={name} value={selectedValue} />
    </div>
  );
}
