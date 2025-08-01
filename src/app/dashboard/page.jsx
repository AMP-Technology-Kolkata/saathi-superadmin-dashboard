
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import data from "./data.json"; // Assuming data.json is in the same directory

export default function Page() {
    return (
        <div className="flex flex-1 flex-col gap-2">
            {/* Example dashboard content, update as needed */}
            <SectionCards />
            <ChartAreaInteractive />
            <DataTable data={data} />
        </div>
    );
}
