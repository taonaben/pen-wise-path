import { Eye, FileText, Menu, Pencil, RotateCcw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalesRecordViewModel } from "../types/sales.types";
import {
  formatCurrency,
  formatKg,
  formatPaymentStatus,
  formatPercent,
  formatPredictionAccuracy,
  formatSaleStatus,
} from "./salesUiFormat";

type Props = {
  rows: SalesRecordViewModel[];
  onView: (row: SalesRecordViewModel) => void;
  onEdit: (row: SalesRecordViewModel) => void;
  onVoid: (row: SalesRecordViewModel) => void;
  onViewAnimal: (animalId: string) => void;
};

export function SalesTable({ rows, onView, onEdit, onVoid, onViewAnimal }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border bg-farm-800/70 p-8 text-center">
        <div className="text-lg font-semibold text-foreground">No sales records yet</div>
        <p className="mt-2 text-sm text-farm-muted">
          Record the first animal sale to start building revenue and profit analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-farm-800/70 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sale Date</TableHead>
            <TableHead>Animal</TableHead>
            <TableHead>Species</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Sale Weight</TableHead>
            <TableHead>Price / Kg</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Profit</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead>Prediction</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className={row.saleStatus === "voided" ? "opacity-60" : undefined}>
              <TableCell>{row.soldAt}</TableCell>
              <TableCell className="font-medium">{row.tagNumber}</TableCell>
              <TableCell>{row.speciesName}</TableCell>
              <TableCell>
                <div>{row.buyerName}</div>
                <div className="text-xs text-farm-muted">{formatPaymentStatus(row.paymentStatus)}</div>
              </TableCell>
              <TableCell>{formatKg(row.saleWeightKg)}</TableCell>
              <TableCell>{formatCurrency(row.pricePerKg, row.currency)}/kg</TableCell>
              <TableCell>{formatCurrency(row.grossAmount, row.currency)}</TableCell>
              <TableCell>{formatCurrency(row.totalCost, row.currency)}</TableCell>
              <TableCell className={row.netProfit < 0 ? "text-farm-danger" : "text-farm-success"}>
                {formatCurrency(row.netProfit, row.currency)}
              </TableCell>
              <TableCell>{formatPercent(row.profitMarginPercentage)}</TableCell>
              <TableCell>
                <div>{formatPredictionAccuracy(row.predictionAccuracy)}</div>
                <div className="text-xs text-farm-muted">{formatSaleStatus(row.saleStatus)}</div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="icon" variant="ghost" aria-label="Sale actions">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onView(row)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewAnimal(row.animalId)}>
                      <UserRound className="mr-2 h-4 w-4" />
                      View animal
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={row.saleStatus === "voided"}
                      onClick={() => onEdit(row)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit sale
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.print()}>
                      <FileText className="mr-2 h-4 w-4" />
                      Print receipt
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={row.saleStatus === "voided"}
                      onClick={() => onVoid(row)}
                      className="text-farm-danger focus:text-farm-danger"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Void sale
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
