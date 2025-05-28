import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PauseCircleIcon,
  UserCircleIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  PhoneXMarkIcon,
  ArrowPathIcon as SpinnerIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

export const Icons = {
  online: CheckCircleIcon,
  offline: XCircleIcon,
  paused: PauseCircleIcon,
  waiting: ClockIcon,
  user: UserCircleIcon,
  phone: PhoneIcon,
  phoneCall: PhoneIcon,
  phoneOff: PhoneXMarkIcon,
  chat: ChatBubbleLeftIcon,
  email: EnvelopeIcon,
  refresh: ArrowPathIcon,
  error: ExclamationCircleIcon,
  spinner: SpinnerIcon,
  checkCircle: CheckCircleIcon,
  star: StarIcon,
} as const;

export type IconName = keyof typeof Icons; 