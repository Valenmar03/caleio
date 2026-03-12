import type { AgendaAppointment, Professional } from "../../types/entities";
import MobileDayView from "./MobileDayView";

type Props = {
  selectedDay: Date;
  appointments: AgendaAppointment[];
  HOURS: number[];
  professionals: Professional[]
  selectedProfessionalId: string;
  handleSlotClick: (
    date: Date,
    time: string,
    professionalId?: string,
  ) => void;
  handleAppointmentClick: (appointment: AgendaAppointment) => void;
};

export default function MobileWeekView(props: Props) {
  return <MobileDayView {...props} date={props.selectedDay} />;
}