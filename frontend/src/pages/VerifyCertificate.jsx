import { useParams } from "react-router-dom";

export default function VerifyCertificate() {
  const { testId } = useParams();
  // Bu yerda testId bo'yicha backenddan tekshiruv natijasini olish mumkin
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-['Inter']">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center border border-slate-100 max-w-lg w-full">
        <h1 className="text-2xl font-black text-blue-700 mb-4">Sertifikat Tekshiruvi</h1>
        <p className="text-slate-700 mb-6">Test ID: <b>{testId}</b></p>
        <p className="text-green-600 font-bold text-lg">Sertifikat haqiqiy!</p>
        {/* Bu yerda haqiqiylikni backenddan tekshirish va tafsilotlarni chiqarish mumkin */}
      </div>
    </div>
  );
}
