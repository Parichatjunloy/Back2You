import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function StaffReturns({ user, onBack, onLogout }) {
  const [eligibleClaims, setEligibleClaims] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [note, setNote] = useState("");

  const token = localStorage.getItem("back2you_token");

  const loadData = useCallback(async () => {
    if (!token) {
      onLogout?.();
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/staff/returns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout?.();
          return;
        }

        throw new Error(
          data.message || "ไม่สามารถโหลดข้อมูลการคืนของได้"
        );
      }

      setEligibleClaims(data.eligibleClaims || []);
      setReturns(data.returns || []);
    } catch (error) {
      alert(error.message || "ไม่สามารถโหลดข้อมูลการคืนของได้");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaimChange = (event) => {
    const value = event.target.value;
    setSelectedClaimId(value);

    const claim = eligibleClaims.find(
      (item) => String(item.claim_id) === String(value)
    );

    setReceiverName(claim?.claimant_name || "");
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (
      !selectedClaimId ||
      !returnDate ||
      !returnLocation.trim() ||
      !receiverName.trim()
    ) {
      alert("กรุณากรอกข้อมูลนัดคืนให้ครบ");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/api/staff/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          claimId: Number(selectedClaimId),
          returnDate,
          returnLocation: returnLocation.trim(),
          receiverName: receiverName.trim(),
          note: note.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถสร้างนัดคืนได้");
      }

      alert(data.message || "สร้างนัดคืนเรียบร้อยแล้ว");

      setSelectedClaimId("");
      setReturnDate("");
      setReturnLocation("");
      setReceiverName("");
      setNote("");

      await loadData();
    } catch (error) {
      alert(error.message || "ไม่สามารถสร้างนัดคืนได้");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (returnId) => {
    const confirmed = window.confirm(
      "ต้องการยกเลิกนัดคืนรายการนี้หรือไม่?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/staff/returns/${returnId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถยกเลิกนัดได้");
      }

      alert(data.message || "ยกเลิกนัดเรียบร้อยแล้ว");
      await loadData();
    } catch (error) {
      alert(error.message || "ไม่สามารถยกเลิกนัดได้");
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const statusLabel = (status) => {
    if (status === "scheduled") return "นัดคืนแล้ว";
    if (status === "completed") return "คืนสำเร็จ";
    if (status === "cancelled") return "ยกเลิก";
    return status || "-";
  };

  const statusClass = (status) => {
    if (status === "completed") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "cancelled") {
      return "bg-red-50 text-red-600";
    }

    return "bg-blue-50 text-[#397fd2]";
  };

  return (
    <div className="min-h-screen bg-[#eaf3ff] text-[#334155]">
      <header className="bg-[#5b9bea] border-b border-blue-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[68px] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="bg-white rounded-full px-4 py-2 text-sm font-bold shadow-sm"
          >
            ← กลับ Dashboard
          </button>

          <div className="text-center">
            <p className="text-white font-bold">จัดการคืนของ</p>
            <p className="text-blue-100 text-xs">
              {user?.name || "Staff"}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="bg-white/15 text-white rounded-full px-4 py-2 text-sm font-bold"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <section className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-[#5b9bea]">
              Return Schedule
            </p>
            <h1 className="text-2xl font-bold mt-1">
              สร้างนัดคืนของ
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              เลือกได้เฉพาะ Claim ที่ Staff อนุมัติแล้วและยังไม่มีรายการคืน
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              กำลังโหลดข้อมูล...
            </div>
          ) : eligibleClaims.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-[#f7fbff] border border-blue-100 p-5 text-sm text-slate-500">
              ยังไม่มี Claim ที่พร้อมสร้างนัดคืน
            </div>
          ) : (
            <form
              onSubmit={handleCreate}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
            >
              <label className="md:col-span-2">
                <span className="text-sm font-bold">
                  Claim ที่อนุมัติแล้ว
                </span>
                <select
                  value={selectedClaimId}
                  onChange={handleClaimChange}
                  className="w-full mt-2 rounded-xl bg-[#edf5ff] border border-blue-100 px-4 py-3 outline-none"
                >
                  <option value="">เลือก Claim</option>
                  {eligibleClaims.map((claim) => (
                    <option
                      key={claim.claim_id}
                      value={claim.claim_id}
                    >
                      CL-{String(claim.claim_id).padStart(4, "0")} — {claim.found_item_title} — {claim.claimant_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-sm font-bold">
                  วันและเวลานัดคืน
                </span>
                <input
                  type="datetime-local"
                  value={returnDate}
                  onChange={(event) =>
                    setReturnDate(event.target.value)
                  }
                  className="w-full mt-2 rounded-xl bg-[#edf5ff] border border-blue-100 px-4 py-3 outline-none"
                />
              </label>

              <label>
                <span className="text-sm font-bold">
                  ชื่อผู้รับ
                </span>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(event) =>
                    setReceiverName(event.target.value)
                  }
                  className="w-full mt-2 rounded-xl bg-[#edf5ff] border border-blue-100 px-4 py-3 outline-none"
                  placeholder="ชื่อผู้ที่จะมารับของ"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-bold">
                  สถานที่นัดคืน
                </span>
                <input
                  type="text"
                  value={returnLocation}
                  onChange={(event) =>
                    setReturnLocation(event.target.value)
                  }
                  className="w-full mt-2 rounded-xl bg-[#edf5ff] border border-blue-100 px-4 py-3 outline-none"
                  placeholder="เช่น อาคาร A จุดประชาสัมพันธ์"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-bold">
                  หมายเหตุ
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className="w-full mt-2 rounded-xl bg-[#edf5ff] border border-blue-100 px-4 py-3 outline-none resize-none"
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto rounded-xl bg-[#67c5b5] text-white px-6 py-3 font-bold disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "สร้างนัดคืนของ"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="mt-6 bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold">
              ประวัติการคืนของ
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              ทั้งรายการที่นัดไว้ สำเร็จ และยกเลิก
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              กำลังโหลด...
            </div>
          ) : returns.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              ยังไม่มีรายการคืนของ
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {returns.map((item) => (
                <article
                  key={item.id}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">
                        {item.found_item_title}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                          item.status
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
                      <p>
                        <span className="text-slate-400">ผู้รับ:</span>{" "}
                        {item.receiver_name}
                      </p>
                      <p>
                        <span className="text-slate-400">วันเวลา:</span>{" "}
                        {formatDateTime(item.return_date)}
                      </p>
                      <p>
                        <span className="text-slate-400">สถานที่:</span>{" "}
                        {item.return_location}
                      </p>
                      <p>
                        <span className="text-slate-400">Claim:</span>{" "}
                        CL-{String(item.claim_id).padStart(4, "0")}
                      </p>
                    </div>

                    {item.note && (
                      <p className="text-sm text-slate-500 mt-3">
                        หมายเหตุ: {item.note}
                      </p>
                    )}
                  </div>

                  {item.status === "scheduled" &&
                    Number(item.user_confirmed) !== 1 && (
                      <button
                        type="button"
                        onClick={() => handleCancel(item.id)}
                        className="rounded-xl border border-red-200 text-[#ef7777] px-4 py-2.5 text-sm font-bold"
                      >
                        ยกเลิกนัด
                      </button>
                    )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StaffReturns;
