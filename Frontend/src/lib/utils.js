export function formatDate(date){
    return date.toLocaleDateString('en-US',{
        month: "short",
        day: "numeric",
        year: "numeric"
    })
}

export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }