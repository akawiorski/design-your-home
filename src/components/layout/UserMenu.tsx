import { Button } from '../ui/button';

export default function UserMenu({ userEmail }: { userEmail?: string }) {
  const handleLogout = async () => {
    // Mock logout
    await new Promise(resolve => setTimeout(resolve, 500));
    window.location.href = '/login';
  };

  return (
    <div className="flex items-center gap-4">
      {userEmail && <span className="text-sm text-gray-600">{userEmail}</span>}
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Wyloguj
      </Button>
    </div>
  );
}
