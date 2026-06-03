import { renderWithProviders, screen, fireEvent } from './test-utils';
import ReportsTable from '../components/admin/ReportsTable';

const sampleReports = [
  {
    id: 'r1',
    reportedUser: { nameEn: 'Alice Reported', role: 'aspirant' },
    reportedUserType: 'aspirant',
    reportedBy: { nameEn: 'Bob Reporter' },
    reason: 'Spam content',
    status: 'pending',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'r2',
    reportedUser: { nameEn: 'Carol Reported' },
    reportedUserType: 'voter',
    reportedBy: { nameEn: 'Dave Reporter' },
    reason: 'Abusive behavior',
    status: 'resolved',
    createdAt: '2026-02-15T12:30:00Z',
  },
];

describe('ReportsTable', () => {
  it('renders an empty state when there are no reports', () => {
    renderWithProviders(<ReportsTable reports={[]} onView={vi.fn()} />);
    expect(screen.getByText('No reports found')).toBeInTheDocument();
  });

  it('renders a row per report with its key fields', () => {
    renderWithProviders(<ReportsTable reports={sampleReports} onView={vi.fn()} />);

    expect(screen.getByText('Alice Reported')).toBeInTheDocument();
    expect(screen.getByText('Bob Reporter')).toBeInTheDocument();
    expect(screen.getByText('Spam content')).toBeInTheDocument();
    expect(screen.getByText('Carol Reported')).toBeInTheDocument();
    expect(screen.getByText('Abusive behavior')).toBeInTheDocument();
  });

  it('renders status chips with the report status labels', () => {
    renderWithProviders(<ReportsTable reports={sampleReports} onView={vi.fn()} />);
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('resolved')).toBeInTheDocument();
  });

  it('renders a header row plus one row per report', () => {
    renderWithProviders(<ReportsTable reports={sampleReports} onView={vi.fn()} />);
    // 1 header row + 2 body rows
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('fires onView with the report id when the view action is clicked', () => {
    const onView = vi.fn();
    renderWithProviders(<ReportsTable reports={sampleReports} onView={onView} />);

    const viewButtons = screen.getAllByRole('button', { name: 'View details' });
    fireEvent.click(viewButtons[0]);

    expect(onView).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith('r1');
  });
});
