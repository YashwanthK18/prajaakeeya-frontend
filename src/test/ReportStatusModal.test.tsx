import { renderWithProviders, screen, fireEvent, waitFor, within } from './test-utils';
import ReportStatusModal from '../components/admin/ReportStatusModal';

describe('ReportStatusModal', () => {
  it('renders dialog content when open', () => {
    renderWithProviders(
      <ReportStatusModal
        open={true}
        currentStatus="Pending"
        onClose={vi.fn()}
        onSubmit={vi.fn(() => Promise.resolve())}
      />
    );

    expect(screen.getByText('Update Report Status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('does not render dialog content when closed', () => {
    renderWithProviders(
      <ReportStatusModal
        open={false}
        currentStatus="Pending"
        onClose={vi.fn()}
        onSubmit={vi.fn(() => Promise.resolve())}
      />
    );

    expect(screen.queryByText('Update Report Status')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ReportStatusModal
        open={true}
        currentStatus="Pending"
        onClose={onClose}
        onSubmit={vi.fn(() => Promise.resolve())}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits the current status with typed remarks, then closes', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    const onClose = vi.fn();
    renderWithProviders(
      <ReportStatusModal
        open={true}
        currentStatus="Pending"
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    const remarks = screen.getByLabelText('Admin remarks (optional)');
    fireEvent.change(remarks, { target: { value: 'Looks valid' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('Pending', 'Looks valid');
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('lets the user change the status and submits the new value', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    renderWithProviders(
      <ReportStatusModal
        open={true}
        currentStatus="Pending"
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    // Open the MUI Select listbox and pick "Resolved".
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const listbox = within(screen.getByRole('listbox'));
    fireEvent.click(listbox.getByText('Resolved'));

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      // remarks left empty -> passed as undefined
      expect(onSubmit).toHaveBeenCalledWith('Resolved', undefined);
    });
  });
});
