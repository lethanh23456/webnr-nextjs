export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar chỉ cho Dashboard */}
      <aside style={{ width: '200px', background: '#f0f0f0' }}>
        <h3>Dashboard Menu</h3>
        <ul>
          <li>Tổng quan</li>
          <li>Cài đặt</li>
          <li>Thống kê</li>
        </ul>
      </aside>
      
      {/* Nội dung chính */}
      <div style={{ flex: 1, padding: '20px' }}>
        {children}
      </div>
    </div>
  )
}