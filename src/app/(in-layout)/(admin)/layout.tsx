import AdminLayout from "@/components/layouts/AdminLayout";

export default function AdminPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>
    {children}
    </AdminLayout>;
}
