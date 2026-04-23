import { Suspense } from "react";
import SearchPage from "./SearchPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <SearchPage />
    </Suspense>
  );
}