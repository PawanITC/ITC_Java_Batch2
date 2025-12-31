import axios from "axios";
import axiosInstance from "./axiosInstance";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/notification/api/notifications`;

axios.defaults.withCredentials = true;

export const notificationService = {

    async fetchNotifications(userId, page, size) {
        try {

            const response = await axios.get(`${API_BASE_URL}?recipientId=${userId}&page=${page}&size=${size}`);
            return response.data;
        }
        catch (error) {
            console.error("Error fetching notifications:", error);
            throw error;
        }
    },

    async markAsRead(notificationId) {
        try {
            const response = await axios.patch(`${API_BASE_URL}/${notificationId}/read`);
            return response.data;
        }
        catch (error) {
            console.error("Error marking notification as read:", error);
            throw error;
        }
    },

    async fetchUnReadCount(userId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/unReadCount?recipientId=${userId}`);
            return response.data;
        }
        catch (error) {
            console.error("Error marking notification as read:", error);
            throw error;
        }
    },

    async markAllAsRead(userId) {
        try {
            const response = await axios.patch(`${API_BASE_URL}/markAllRead?recipientId=${userId}`);
            return response.data;
        }
        catch (error) {
            console.error("Error marking all notifications as read:", error);
            throw error;
        }
    }

};
