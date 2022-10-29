import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     Friend:
 *       type: object
 *       required:
 *        - first_name
 *        - last_name
 *        - img
 *        - phone
 *        - address_1
 *        - city
 *        - state
 *        - zipcode
 *        - bio
 *       properties:
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         img:
 *           type: string
 *         image:
 *           type: string
 *         phone:
 *           type: string
 *         address_1:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zipcode:
 *           type: number
 *         bio:
 *           type: string
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *         statuses:
 *           type: array
 *           items:
 *              type: string
 *         available:
 *           type: array
 *           items:
 *              type: string
 *         friends:
 *           type: array
 *           items:
 *              type: string
 */

const friendSchema = z.object({
    body: z.object({
      first_name: z.string({
        required_error: "first name is required",
      }),
      last_name: z.string({
          required_error: "last name is required",
        }),
        img: z.string({
          required_error: "profile pic is required",
        }),
        phone: z.string({
          required_error: "phone is required",
        }),
        address_1: z.string({
          required_error: "address is required",
        }),
        city: z.string({
          required_error: "city is required",
        }),
        state: z.string({
          required_error: "state is required",
        }),
        zipcode: z.number({
          required_error: "zipcode is required",
        }),
        bio: z.string({
            required_error: "bio is required",
        }),
        photos: z.array(z.string()),
        statuses: z.array(z.string()),
        available: z.boolean({
           invalid_type_error: "available must be a boolean",
        }),
        friends: z.array(z.string()),
    }),
});

export default friendSchema