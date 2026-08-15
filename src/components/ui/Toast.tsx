import { Toaster } from 'react-hot-toast'

export function ToastViewport() {
  return (
    <Toaster
      position="top-right"
      containerClassName="admin-toaster"
      gutter={12}
      toastOptions={{
        duration: 5000,
        className: 'admin-toast',
      }}
    />
  )
}
