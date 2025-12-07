import './globals.css'
import { Provider } from "react-redux";
import { store } from "../app/redux/store";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <Provider store={store}>{children}</Provider>
    </html>
  )
}