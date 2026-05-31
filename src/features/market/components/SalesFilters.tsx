import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnimalSpecies } from "@/features/animals/types/animal.types";
import type { SalesFilters as SalesFilterState } from "../types/sales.types";

type Props = {
  filters: SalesFilterState;
  species: AnimalSpecies[];
  onChange: (filters: SalesFilterState) => void;
};

export function SalesFilters({ filters, species, onChange }: Props) {
  return (
    <div className="grid gap-2.5 rounded-2xl border bg-farm-800/70 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-6">
      <label className="space-y-1 text-xs sm:text-sm">
        <span className="font-medium text-farm-muted">From</span>
        <Input
          className="h-10"
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || undefined })}
        />
      </label>
      <label className="space-y-1 text-xs sm:text-sm">
        <span className="font-medium text-farm-muted">To</span>
        <Input
          className="h-10"
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(event) => onChange({ ...filters, dateTo: event.target.value || undefined })}
        />
      </label>
      <label className="space-y-1 text-xs sm:text-sm">
        <span className="font-medium text-farm-muted">Species</span>
        <Select
          value={filters.speciesId ?? "all"}
          onValueChange={(value) =>
            onChange({ ...filters, speciesId: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            {species.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="space-y-1 text-xs sm:text-sm">
        <span className="font-medium text-farm-muted">Buyer</span>
        <Input
          className="h-10"
          value={filters.buyer ?? ""}
          placeholder="Search buyer"
          onChange={(event) => onChange({ ...filters, buyer: event.target.value || undefined })}
        />
      </label>
      <label className="space-y-1 text-xs sm:text-sm">
        <span className="font-medium text-farm-muted">Status</span>
        <Select
          value={filters.saleStatus ?? "all"}
          onValueChange={(value) =>
            onChange({ ...filters, saleStatus: value as SalesFilterState["saleStatus"] })
          }
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sales</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending_payment">Pending payment</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="space-y-1 text-xs sm:text-sm">
        <span className="font-medium text-farm-muted">Profit</span>
        <Select
          value={filters.profitStatus ?? "all"}
          onValueChange={(value) =>
            onChange({ ...filters, profitStatus: value as SalesFilterState["profitStatus"] })
          }
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="profit">Profitable</SelectItem>
            <SelectItem value="loss">Loss-making</SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
