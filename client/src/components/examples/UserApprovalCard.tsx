import { UserApprovalCard } from "../UserApprovalCard";

export default function UserApprovalCardExample() {
  return (
    <div className="p-4 max-w-md">
      <UserApprovalCard
        id="1"
        name="Laura Martínez"
        email="laura.martinez@example.com"
        role="Propietario"
        requestDate="10 Oct 2025"
        onApprove={() => console.log("Aprobar usuario")}
        onReject={() => console.log("Rechazar usuario")}
      />
    </div>
  );
}
