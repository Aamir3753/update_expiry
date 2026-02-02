const { source, destinations, nbMehmoodUsers } = require("./data");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const Cookie =
  "49e94fb5b5444c1344515e7958605bdc=9531a66e42c514c95b1f58c31dd6cf5b; ci_session=8q1luf37f3v39qe9pdv2r2fq3d6c7io9";

// const TenMbUsers = destinations.filter((user) => user.package === 9);

const findEncryptedUserId = async (userId) => {
  try {
    const config = {
      method: "get",
      url: `https://lptel.giize.com/user/profile/${userId}/`,
      headers: {
        Cookie: Cookie,
      },
    };
    const resp = await axios.request(config);
    const $ = cheerio.load(resp.data);
    const encryptedUserId = $('input[name="userID"]').first().val();
    return encryptedUserId;
  } catch (err) {
    fs.appendFileSync("failed_users.log", `${userId}\n`);
    // console.log(`Error fetching encrypted user ID for ${userId}:`, err);
  }
};
const updateExpiry = async ({ package, expiry, userId }) => {
  try {
    const FormData = require("form-data");
    let data = new FormData();
    data.append("source_page", "user_all");
    data.append("userID", userId);
    data.append("package", String(package));
    data.append("custom_expiry_type", "2");
    data.append("custom_date", expiry);
    data.append("expirytime", "12:00:00");

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://lptel.giize.com/user/activation",
      headers: {
        Cookie: Cookie,
        ...data.getHeaders(),
      },
      data: data,
    };

    await axios.request(config);
  } catch (error) {
    fs.appendFileSync("failed_users.log", `${userId}\n`);
    // console.error(`Error updating expiry for user ${userId}:`, error);
  }
};
const updateAddress = async ({ address, userId }) => {
  try {
    const FormData = require("form-data");
    let data = new FormData();
    data.append("address", address);
    data.append("userID", userId);
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://lptel.giize.com/user/update",
      headers: {
        Cookie: Cookie,
        ...data.getHeaders(),
      },
      data: data,
    };
    await axios.request(config);
  } catch (error) {
    fs.appendFileSync("failed_address_update.log", `${userId}\n`);
  }
};
const insertUser = async ({ username, package, password }) => {
  try {
    const axios = require("axios");
    const FormData = require("form-data");
    let data = new FormData();
    data.append("name", username);
    data.append("username", username);
    data.append("portalpass", password);
    data.append("package", package);
    data.append("connectiontype", "1");
    data.append("nic", "0");
    data.append("mobile", "0");
    data.append("email", "");
    data.append("phone", "");

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://lptel.giize.com/user/insert",
      headers: {
        Cookie: Cookie,
        ...data.getHeaders(),
      },
      data: data,
    };

    await axios.request(config);
  } catch (error) {
    fs.appendFileSync("failed_insert.log", `Insert Failed: ${username}\n`);
  }
};
// const process = async () => {
//   for (let userToUpdate of destinations) {
//     const userWithExpiry = source.find(
//       (user) => userToUpdate.Username === user.username,
//     );
//     if (userWithExpiry) {
//       const exipriry = userWithExpiry.expiration.split(" ")[0];

//       if (new Date(exipriry) < new Date()) {
//         fs.appendFileSync("skipped_users.log", `${userToUpdate.Username}\n`);
//         continue;
//       }
//       const encryptedUserId = await findEncryptedUserId(userToUpdate.Id);
//       console.log(encryptedUserId);
//       await updateExpiry({
//         package: userWithExpiry.package_id,
//         expiry: userWithExpiry.expiration.split(" ")[0],
//         userId: encryptedUserId,
//       });
//     }
//   }
// };
// process()
//   .then(() => console.log("All users processed"))
//   .catch(console.log);

// const processInsert = async () => {
//   for (let userToInsert of nbMehmoodUsers) {
//     await insertUser({
//       username: userToInsert.username,
//       package: userToInsert.package_id,
//       password: userToInsert.ct_password,
//     });
//     console.log(`Inserted user: ${userToInsert.username}`);
//   }
// };

// processInsert()
//   .then(() => console.log("All users inserted"))
//   .catch(console.log);

const procesUpdateAddress = async () => {
  for (let userToUpdate of destinations) {
    const userWithAddress = source.find(
      (user) => userToUpdate.Username === user.username,
    );
    if (!userWithAddress || userWithAddress.address == "") {
      fs.appendFileSync(
        "failed_address_update.log",
        `${userToUpdate.Username}\n`,
      );
      continue;
    }
    const encryptedUserId = await findEncryptedUserId(userToUpdate.Id);
    console.log(encryptedUserId);
    await updateAddress({
      address: userWithAddress.address,
      userId: encryptedUserId,
    });
  }
};

procesUpdateAddress()
  .then(() => console.log("All users processed"))
  .catch(console.log);
