// COMPONENT / INTEGRATION TEST for AspirantMeetingLinksTab.
//
// NOTE on folder convention: all tests live in src/test/. Because this file is
// NOT next to the component, the import paths are relative to src/test/:
//   component -> ../components/aspirant/AspirantMeetingLinksTab
//   service   -> ../services/aspirantService
// vi.mock() paths must match how THIS file would import the module (they
// resolve to the same file the component imports, so the mock still applies).
//
// This component shows the 3 mocking skills you'll use constantly:
//   1. Mock react-i18next  -> t() returns predictable strings (no i18n engine)
//   2. Mock a service file -> the delete button doesn't hit a real backend
//   3. Pass vi.fn() spies as props -> assert which callbacks fired
//
// Our mocked t() returns the `defaultValue` when given, otherwise the KEY:
//   t('x.noMeetings') || 'fallback'              -> "x.noMeetings"  (key)
//   t('x.meetLinkDomain', { defaultValue: 'Y' }) -> "Y"             (defaultValue)

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AspirantMeetingLinksTab from '../components/aspirant/AspirantMeetingLinksTab';
import { deleteAspirantsMeeting } from '../services/aspirantService';

// --- Mock 1: i18n. Return defaultValue if given, else the key. ---
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}));

// --- Mock 2: the aspirant service. The component only uses this one export. ---
vi.mock('../services/aspirantService', () => ({
  deleteAspirantsMeeting: vi.fn(() => Promise.resolve({ data: {} })),
}));

// Renders the component with default props and returns the spies so each test
// can tweak just what it needs.
function setup(profileOverrides: Record<string, unknown> = {}) {
  const props = {
    aspirantProfile: { meetLink: '', meetPlatform: '', meetings: [], ...profileOverrides },
    setAspirantProfile: vi.fn(),
    handleSaveMeet: vi.fn(),
    fetchAspirantMeetings: vi.fn(),
    openNoteDialog: vi.fn(),
  };
  render(<AspirantMeetingLinksTab {...(props as any)} />);
  return props;
}

// A meeting far in the future so it renders as "upcoming".
const futureMeeting = {
  id: 1,
  title: 'Town Hall',
  platform: 'zoom',
  meetingLink: 'https://zoom.us/j/12345678',
  scheduledAt: 4102444800000, // ~ year 2100
};

describe('AspirantMeetingLinksTab', () => {
  describe('rendering', () => {
    it('renders the meeting link field and Save button', () => {
      setup();
      expect(
        screen.getByLabelText('userDashboard.aspirant.meetLinkLabel')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('shows the empty state when there are no meetings', () => {
      setup({ meetings: [] });
      expect(
        screen.getByText('userDashboard.aspirant.noMeetings')
      ).toBeInTheDocument();
    });

    it('renders a scheduled meeting with its title and platform', () => {
      setup({ meetings: [futureMeeting] });
      expect(screen.getByText('Town Hall')).toBeInTheDocument();
      expect(screen.getByText('Zoom')).toBeInTheDocument();
      expect(
        screen.queryByText('userDashboard.aspirant.noMeetings')
      ).not.toBeInTheDocument();
    });
  });

  describe('meeting link validation', () => {
    it('shows an error for a link from a non-allowed domain', () => {
      setup();
      const input = screen.getByLabelText('userDashboard.aspirant.meetLinkLabel');
      fireEvent.change(input, {
        target: { value: 'https://example.com/whatever' },
      });
      expect(
        screen.getByText(
          'Enter a valid meeting link (Google Meet / Zoom / Instagram / Facebook)'
        )
      ).toBeInTheDocument();
    });

    it('calls setAspirantProfile when the link changes', () => {
      const props = setup();
      const input = screen.getByLabelText('userDashboard.aspirant.meetLinkLabel');
      fireEvent.change(input, {
        target: { value: 'https://meet.google.com/abc-defg-hij' },
      });
      expect(props.setAspirantProfile).toHaveBeenCalled();
    });
  });

  describe('Save button', () => {
    it('calls handleSaveMeet when the link is valid', () => {
      const props = setup({ meetLink: 'https://meet.google.com/abc-defg-hij' });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(props.handleSaveMeet).toHaveBeenCalledTimes(1);
    });

    it('does NOT call handleSaveMeet when the link is invalid', () => {
      const props = setup({ meetLink: 'https://example.com/not-a-meeting' });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(props.handleSaveMeet).not.toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('calls fetchAspirantMeetings when the refresh button is clicked', () => {
      const props = setup();
      fireEvent.click(screen.getByRole('button', { name: 'Refresh meetings' }));
      expect(props.fetchAspirantMeetings).toHaveBeenCalledTimes(1);
    });

    it('opens the note dialog with the meeting when "Add Note" is clicked', () => {
      const props = setup({ meetings: [futureMeeting] });
      fireEvent.click(
        screen.getByRole('button', { name: 'userDashboard.aspirant.addNote' })
      );
      expect(props.openNoteDialog).toHaveBeenCalledWith(futureMeeting);
    });

    it('deletes a meeting: calls the service, refetches, and shows a success message', async () => {
      const props = setup({ meetings: [futureMeeting] });

      fireEvent.click(screen.getByRole('button', { name: 'Delete meeting' }));

      await waitFor(() => {
        expect(deleteAspirantsMeeting).toHaveBeenCalledWith({ meetingIds: [1] });
      });
      expect(props.fetchAspirantMeetings).toHaveBeenCalled();
      expect(props.setAspirantProfile).toHaveBeenCalled();
      expect(
        await screen.findByText('userDashboard.aspirant.deleted')
      ).toBeInTheDocument();
    });
  });
});
