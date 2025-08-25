import { NextFunction, Request, Response, Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { Contact } from "./contact.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";



const router = Router()

// Define contact routes here
router.post('/',  catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

     const contact = await Contact.create(req.body);
   
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Contact message received successfully!',
      data: contact,
    });
  }
));

router.get('/', checkAuth(Role.ADMIN), catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const contacts = Contact.find();
    

    const queryBuilders =new QueryBuilder(contacts, req.query as Record<string, string>)


    const result = await queryBuilders.search(['name','email','subject'])
    .filter()
    .paginate()

const [data, meta] = await Promise.all([
    result.build().exec(),
    queryBuilders.getMeta(),
  ]);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Contacts retrieved successfully!',
      data: {
        meta,
        data
      },
    });
  }
));
export const contactRoute = router