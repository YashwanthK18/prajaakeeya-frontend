import { renderWithProviders, screen, fireEvent } from './test-utils';
import UsersTable from '../components/admin/UsersTable';

const sampleUsers = [
  { id: 1, name: 'Active Annie', role: 'aspirant', isBlocked: false, profilePicture: null },
  { id: 2, name: 'Blocked Ben', role: 'voter', isBlocked: true, profilePicture: null },
];

describe('UsersTable', () => {
  it('renders an empty state when there are no users', () => {
    renderWithProviders(<UsersTable users={[]} />);
    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('renders a row per user with name and role', () => {
    renderWithProviders(<UsersTable users={sampleUsers} onToggleBlock={vi.fn()} />);

    expect(screen.getByText('Active Annie')).toBeInTheDocument();
    expect(screen.getByText('aspirant')).toBeInTheDocument();
    expect(screen.getByText('Blocked Ben')).toBeInTheDocument();
    expect(screen.getByText('voter')).toBeInTheDocument();
  });

  it('shows Active / Blocked status chips based on isBlocked', () => {
    renderWithProviders(<UsersTable users={sampleUsers} onToggleBlock={vi.fn()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('fires onToggleBlock with the user when the block action is clicked', () => {
    const onToggleBlock = vi.fn();
    renderWithProviders(<UsersTable users={sampleUsers} onToggleBlock={onToggleBlock} />);

    // Active user shows the "Block" tooltip/action.
    const blockButton = screen.getByRole('button', { name: 'Block' });
    fireEvent.click(blockButton);

    expect(onToggleBlock).toHaveBeenCalledTimes(1);
    expect(onToggleBlock).toHaveBeenCalledWith(sampleUsers[0]);
  });

  it('fires onToggleBlock for an already-blocked user via the Unblock action', () => {
    const onToggleBlock = vi.fn();
    renderWithProviders(<UsersTable users={sampleUsers} onToggleBlock={onToggleBlock} />);

    const unblockButton = screen.getByRole('button', { name: 'Unblock' });
    fireEvent.click(unblockButton);

    expect(onToggleBlock).toHaveBeenCalledWith(sampleUsers[1]);
  });
});
