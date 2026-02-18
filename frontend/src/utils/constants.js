export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ROLES = {
    PARTICIPANT: 'participant',
    ORGANIZER: 'organizer',
    ADMIN: 'admin',
};

export const EVENT_TYPES = {
    NORMAL: 'normal',
    MERCHANDISE: 'merchandise',
};

export const EVENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CLOSED: 'closed',
};

export const PARTICIPANT_TYPES = {
    IIIT: 'iiit',
    NON_IIIT: 'non-iiit',
};

export const INTEREST_OPTIONS = [
    'Technology', 'Music', 'Dance', 'Art', 'Drama',
    'Sports', 'Literature', 'Photography', 'Gaming',
    'Robotics', 'AI/ML', 'Cybersecurity', 'Web Dev',
    'Entrepreneurship', 'Design', 'Social Service',
];
