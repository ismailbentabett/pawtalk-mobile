export interface OperatingHours {
    open: string;
    close: string;
  }
  
  export interface Address {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }
  
  export interface Shelter {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: Address;
    operatingHours: {
      [key in DayOfWeek]: OperatingHours;
    };
    moderators: string[];
  }
  
  export type DayOfWeek = 
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';