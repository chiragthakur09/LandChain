import { TransferParcelForm } from "@/components/TransferParcelForm";

export default function TransferParcelPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6 text-center">Transfer Ownership</h1>
            <TransferParcelForm />
        </div>
    );
}
