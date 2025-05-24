'use client';

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(val => val !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const selectedLabels = options
    .filter(option => selectedValues.includes(option.value))
    .map(option => option.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-auto min-h-[2.5rem]", triggerClassName)}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedLabels.length > 0 ? (
              selectedLabels.map(label => (
                <Badge
                  variant="secondary"
                  key={label}
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent popover from closing
                    const optionToDeselect = options.find(opt => opt.label === label);
                    if (optionToDeselect) {
                      handleSelect(optionToDeselect.value);
                    }
                  }}
                >
                  {label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[--radix-popover-trigger-width] p-0", contentClassName)} align="start">
        <Command className={className}>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label} // CommandItem value is used for filtering by label
                  onSelect={() => {
                    handleSelect(option.value);
                    // setOpen(false); // Keep open for multi-select
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 