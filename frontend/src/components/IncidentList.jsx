export default function IncidentList({ incidents, user }) {
  if (!incidents || incidents.length === 0) {
    return (
      <div style={{ color: "#6b7280", fontSize: "14px" }}>
        No incidents found
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {incidents.map((incident) => (
        <div
          key={incident.id}
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              {incident.title}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "6px",
              }}
            >
              {incident.description}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              #{incident.id} • Reporter: {incident.reporterName || "N/A"}
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "12px" }}>
            <div
              style={{
                marginBottom: "4px",
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                display: "inline-block",
              }}
            >
              {incident.status}
            </div>
            <div>Priority: {incident.priority}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
