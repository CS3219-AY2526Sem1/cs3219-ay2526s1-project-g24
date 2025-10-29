import React from "react";
import Button from "./Button";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={onCancel}
            ></div>
            <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
                <h3 className="font-montserrat text-2xl font-semibold text-black mb-3">
                    {title}
                </h3>
                <p className="font-montserrat text-gray-500 mb-6">{message}</p>
                <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button variant="danger" onClick={onConfirm}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
