import ProductList from './components/ProductList';
import ReservationTimer from './components/ReservationTimer';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Flash Sale Reservation System
        </h1>
        <p className="text-gray-600 mt-2">
          Reserve products for 2 minutes. Complete purchase before time expires!
        </p>
        <div className="flex justify-center space-x-4 mt-4 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span>Active</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            <span>Expired</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-black">
              <span className="mr-2 color-black">🛒</span> Available Products
            </h2>
            <ProductList />
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-black">
              <span className="mr-2 color-black">📋</span> Your Reservations
            </h2>
            <ReservationTimer />
          </div>
        </div>
      </div>
    </div>
  );
}