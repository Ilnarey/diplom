import Header from './Header';
import { Outlet } from 'react-router-dom';

export default function LayoutWithHeader({ user, setUser }) {
  return (
    <>
      <Header user={user} setUser={setUser}/>
      <Outlet />
    </>
  );
}
