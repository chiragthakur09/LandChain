import { CreateParcelForm } from "@/components/CreateParcelForm";

export default function CreateParcelPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6 text-center">Land Registry Management</h1>
            <CreateParcelForm />
        </div>
    );
}
