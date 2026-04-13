"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface DeleteAgencyButtonProps {
  agencyId: string;
  agencyName: string;
  negotiatorCount: number;
  ambassadorCount: number;
  leadCount: number;
}

export default function DeleteAgencyButton({
  agencyId,
  agencyName,
  negotiatorCount,
  ambassadorCount,
  leadCount,
}: DeleteAgencyButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [reassignTo, setReassignTo] = useState("");
  const [otherAgencies, setOtherAgencies] = useState<{ id: string; name: string }[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agencies")
      .then(r => r.json())
      .then((list: { id: string; name: string }[]) => {
        setOtherAgencies(list.filter(a => a.id !== agencyId));
      })
      .catch(() => {});
  }, [agencyId]);

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    const url = reassignTo
      ? `/api/agencies/${agencyId}?reassignTo=${reassignTo}`
      : `/api/agencies/${agencyId}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/agences");
    } else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  const hasData = negotiatorCount > 0 || ambassadorCount > 0 || leadCount > 0;

  return (
    <>
      <button
        onClick={() => { setReassignTo(""); setError(""); setShowModal(true); }}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Supprimer l&apos;agence
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="font-semibold text-red-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                  Supprimer l&apos;agence
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-700">
                Vous êtes sur le point de supprimer l&apos;agence <strong>{agencyName}</strong>. Cette action est <strong>irréversible</strong>.
              </p>

              {hasData && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm text-amber-800 font-medium">Cette agence contient :</p>
                  <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
                    {negotiatorCount > 0 && (
                      <li>• {negotiatorCount} négociateur{negotiatorCount > 1 ? "s" : ""}</li>
                    )}
                    {ambassadorCount > 0 && (
                      <li>• {ambassadorCount} ambassadeur{ambassadorCount > 1 ? "s" : ""}</li>
                    )}
                    {leadCount > 0 && (
                      <li>• {leadCount} recommandation{leadCount > 1 ? "s" : ""}</li>
                    )}
                  </ul>
                </div>
              )}

              {otherAgencies.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Réattribuer à une autre agence :
                  </label>
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold bg-white"
                  >
                    <option value="">
                      {hasData ? "Ne pas réattribuer (supprimer les négociateurs, détacher le reste)" : "Aucune réattribution"}
                    </option>
                    {otherAgencies.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {!reassignTo && hasData && negotiatorCount > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Sans réattribution, les {negotiatorCount} négociateur{negotiatorCount > 1 ? "s" : ""} et leur{negotiatorCount > 1 ? "s" : ""} compte{negotiatorCount > 1 ? "s" : ""} seront supprimés.
                    </p>
                  )}
                </div>
              ) : hasData ? (
                <div className="bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-800">
                    Aucune autre agence disponible. Les négociateurs seront supprimés et les ambassadeurs/leads seront détachés.
                  </p>
                </div>
              ) : null}

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
