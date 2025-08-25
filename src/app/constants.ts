export const notAllowedStatus = ['IN_TRANSIT', 'DELIVERED', 'CONFIRMED'];
export const excludeField = ['searchTerm', 'sort', 'fields', 'page', 'limit'];
export const parcelSearchableFields = ['trackingId', 'senderEmail', 'receiverEmail', 'origin', 'destination', 'currentLocation', 'status'];
export const userSearchableFields = ['name', 'email', 'role', 'status'];
export const parcelFilterableFields = ['status', 'senderEmail', 'receiverEmail', 'origin', 'destination'];
export const userFilterableFields = ['role', 'status'];