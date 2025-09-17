import { create } from "zustand";
import api from "../lib/axios";
import toast from 'react-hot-toast'
import { useSocketStore } from "./useSocketStore";



export const userChatStore = create((set,get)=>({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    getUsers: async()=>{
        set({isUsersLoading: true})
        try {
            const res = await api.get('/api/message/users');
            set({users: res.data.filteredUsers});
            
        } catch (error) {
            toast.error(error.reponse.data.message)
            
        }finally{
            set({isUsersLoading: false})
        }
    },

    getMessages: async(userId) =>{
        set({isMessagesLoading: true})
        try{
            const res = await api.get(`/api/message/${userId}`);
            set({messages: res.data.messages});
        } catch(error){
            toast.error(error.response.data.message)
        } finally{
            set({isMessagesLoading:false});
        }
    },

    sendMessages: async (messageData) =>{
        const {selectedUser, messages} = get()
        try {
            const formData = new FormData();
            if (messageData.text) formData.append("text", messageData.text);
            if (messageData.image) formData.append("image", messageData.image);

            const res = await api.post(`/api/message/send/${selectedUser._id}`, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                });
            
            if (res.data.success){
                set({messages: [...messages, res.data.newMessage]})
            }

        } catch (error) {
            console.error(error);
            
        }
    },

    deleteMessage: async(messageId)=>{
        try {
            await api.delete(`/api/message/${messageId}`);
            set({
                messages: get().messages.filter((m) => m._id !== messageId)
            })
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete message");  
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useSocketStore.getState().socket;

        // socket.on("newMessage", (newMessage) => {
        // const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
        // if (!isMessageSentFromSelectedUser) return;

        // set({
        //     messages: [...get().messages, newMessage],
        // });
        // });
        socket.on("newMessage", (newMessage) => {
    const senderId =
      typeof newMessage.senderId === "object"
        ? newMessage.senderId._id
        : newMessage.senderId;
    const receiverId =
      typeof newMessage.receiverId === "object"
        ? newMessage.receiverId._id
        : newMessage.receiverId;

    if (senderId !== selectedUser._id && receiverId !== selectedUser._id) return;

    set({ messages: [...get().messages, newMessage] });
  });

        socket.on("messageDeleted", ({ messageId }) => {
    set({
      messages: get().messages.filter((m) => m._id !== messageId),
    });
  });
  },



    unsubscribeFromMessages: ()=>{
        const socket = useSocketStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser })

    

}))