import { cssInterop } from 'nativewind';
import * as Lucide from 'lucide-react-native';

// Every Lucide icon you use in the app. Add to this list as you go.
const ICONS = {
  Bell: Lucide.Bell,
  Home: Lucide.Home,
  Search: Lucide.Search,
  Plus: Lucide.Plus,
  User: Lucide.User,
  ArrowLeft: Lucide.ArrowLeft,
  Info: Lucide.Info,
  Send: Lucide.Send,
  Paperclip: Lucide.Paperclip,
  ImageIcon: Lucide.Image,
  ImagePlus: Lucide.ImagePlus,
  Sparkles: Lucide.Sparkles,
  X: Lucide.X,
  Check: Lucide.Check,
  CheckCheck: Lucide.CheckCheck,
  Play: Lucide.Play,
  Phone: Lucide.Phone,
  Video: Lucide.Video,
  PhoneOff: Lucide.PhoneOff,
  Mic: Lucide.Mic,
  Square: Lucide.Square,
  Ellipsis: Lucide.Ellipsis,
  Bookmark: Lucide.Bookmark,
  History: Lucide.History,
  MessageCircle: Lucide.MessageCircle,
  Share2: Lucide.Share2,
  UserPlus: Lucide.UserPlus,
  UserCheck: Lucide.UserCheck,
  UserMinus: Lucide.UserMinus,
  Clock: Lucide.Clock,
  MoreVertical: Lucide.MoreVertical,
  Ban: Lucide.Ban,
  Shield: Lucide.Shield,
  ShieldOff: Lucide.ShieldOff,
  FileText: Lucide.FileText,
  Users: Lucide.Users,
  Moon: Lucide.Moon,
  Lock: Lucide.Lock,
  Trash2: Lucide.Trash2,
  Flag: Lucide.Flag,
  Edit3: Lucide.Edit3,
  ThumbsUp: Lucide.ThumbsUp,
  ChevronRight: Lucide.ChevronRight,
  TrendingUp: Lucide.TrendingUp,
  Hash: Lucide.Hash,
  Globe: Lucide.Globe,
  Settings2: Lucide.Settings2,
  Edit: Lucide.Edit,
  LogOut: Lucide.LogOut,
  Pencil: Lucide.Pencil,
  Eye: Lucide.Eye,
  EyeOff: Lucide.EyeOff,
  Camera: Lucide.Camera,
  Sun: Lucide.Sun,
  Monitor: Lucide.Monitor,
  MessageSquareWarning: Lucide.MessageSquareWarning,
  Pause: Lucide.Pause,
  MicOff: Lucide.MicOff,
  VideoOff: Lucide.VideoOff,
  SwitchCamera: Lucide.SwitchCamera,
  Languages: Lucide.Languages,
  // ... add more as you use them
} as const;

// Apply cssInterop once per icon — at module load, before any render
Object.values(ICONS).forEach((icon) => {
  cssInterop(icon, {
    className: {
      target: 'style',
      nativeStyleToProp: { color: true, opacity: true },
    },
  });
});

// Export all the icons
export const { Bell, ArrowLeft, Info, Send, Paperclip, ImageIcon, Sparkles, X, Check, CheckCheck, Globe, Edit,
  Play, Phone, Video, PhoneOff, Mic, Square, Ellipsis, Bookmark, History, MessageCircle, Share2, ImagePlus,
  UserPlus, UserCheck, UserMinus, Clock, MoreVertical, Ban, Shield, ShieldOff, FileText, Users, Moon, Settings2,  
  Lock, Trash2, Flag, Edit3, Search, Home, Plus, User, ThumbsUp, ChevronRight, TrendingUp, Hash, LogOut, Pencil,
  Eye, EyeOff, Camera, Sun, Monitor, MessageSquareWarning, Pause, MicOff, VideoOff, SwitchCamera, Languages } = ICONS;