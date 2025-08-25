import mongoose from "mongoose";




export interface IContact extends mongoose.Document {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Contact = mongoose.model<IContact>("Contact", contactSchema);