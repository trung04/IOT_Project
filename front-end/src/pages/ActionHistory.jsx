import Header from "../component/Header";
import { useState, useEffect } from "react";
import axios from "axios";
import Stack from "@mui/material/Stack";
import Pagination from "@mui/material/Pagination";

import { parse, format, isValid } from 'date-fns';

const ActionHistory = () => {
    const [dataActionHistory, setDataActionHistory] = useState([]);
    const [number, setNumber] = useState(1);
    const [searchBy, setSearchBy] = useState("all");
    const [searchValue, setSearchValue] = useState("");
    const [temp1, setTemp1] = useState("all");
    const [temp2, setTemp2] = useState("");
    const [page, setPage] = useState(1);
    const handlePage = (page) => {
        setPage(page);
        setSortBy({
            name: "id",
            status: true
        })
    }
    const [sortBy, setSortBy] = useState({
        name: "id",
        status: true
    });
    const handleSortBy = (name) => {
        if (sortBy.name === name) {
            setSortBy(pre => ({
                ...pre,
                status: !pre.status
            }));
        } else {
            setSortBy({
                name: name,
                status: true
            });
        }
    }
    //sắp xếp dữ liệu front-end
    // useEffect(() => {
    //     if (!sortBy || !sortBy.name) return;

    //     const sorted = [...dataActionHistory].sort((a, b) => {
    //         const aValue = sortBy.name === 'created_at' ? new Date(a[sortBy.name]) : a[sortBy.name];
    //         const bValue = sortBy.name === 'created_at' ? new Date(b[sortBy.name]) : b[sortBy.name];

    //         // Nếu là Date hoặc số: dùng phép trừ
    //         if (aValue instanceof Date || typeof aValue === 'number') {
    //             return sortBy.status ? bValue - aValue : aValue - bValue;
    //         }

    //         // Nếu là string: dùng localeCompare
    //         if (typeof aValue === 'string') {
    //             return sortBy.status
    //                 ? bValue.localeCompare(aValue)
    //                 : aValue.localeCompare(bValue);
    //         }
    //         return 0; // fallback
    //     });
    //     setDataActionHistory(sorted);
    // }, [sortBy]);
    //lấy dữ liệu
    useEffect(() => {
        const fetch = async () => {
            try {
                const words = searchValue.trim().split(" ");
                let isDate = false;
                let searchDate = "";
                // nếu là chuỗi , xử lý theo đúng format ngày của database
                if (words.length == 2) {
                    isDate = true;
                    const [day, month, year] = words[1].split('/');
                    const reversedDate = `${year}-${month.padStart(2, 0)}-${day.padStart(2, 0)}`;
                    searchDate = reversedDate.trim() + " " + words[0].trim();
                }
                else if (words.length == 1) {
                    isDate = searchValue.trim().includes("/");

                    if (isDate) {
                        const date = searchValue.trim().split("/");

                        if (date.length == 3) {
                            searchDate = `${date[2]}-${date[1].padStart(2, 0)}-${date[0].padStart(2, 0)}`;
                        }
                        else if (date.length == 2) {
                            searchDate = `${date[1]}-${date[0].padStart(2, 0)}`;
                        }

                    }
                }

                const data = {
                    "page": page,
                    "sizePage": 10,
                    "searchBy": searchBy,
                    "searchValue": isDate ? searchDate : searchValue,
                    "sortBy": sortBy.name,
                    "statusSortBy": sortBy.status
                };
                console.log(data);
                const res = await axios.post("http://localhost:3001/action-history", data);
                console.log(res);
                setDataActionHistory(res.data.data);
                setNumber(res.data.totalRecord);
            } catch (error) {
                console.log(error);
            }



        }
        fetch();
        console.log(dataActionHistory);

    }, [page, searchBy, searchValue, sortBy]);
    return (<>
        <Header />
        <div className="" style={{ background: "#D9E5F6", minHeight: "100vh" }}>
            <p className="fw-bold fs-1 p-5 ">ACTION HISTORY</p>
            <div className="container">
                <div className="row">
                    <div className="col">
                        <input onChange={(e) => { setTemp2(e.target.value) }} type="text" class="form-control border border-dark p-2" placeholder="Search( Device, Action, Datetime )" />
                        <small className="text-start d-block">
                            <div className="fw-bold ">Tìm kiếm theo ngày</div>
                            <div>dd/MM/yyyy &nbsp; ví dụ: <strong>10/09/2025</strong></div>
                            <div>HH:mm:ss dd/MM/yyyy &nbsp; ví dụ: <strong>15:53:48 10/09/2025</strong></div>
                        </small>
                    </div>
                    <div className="col-2 ">
                        <select onChange={(e) => {
                            setTemp1(e.target.value)
                        }} class="form-select border border-dark p-2" aria-label="Default select example">
                            <option selected value="all">All</option>
                            <option value="device">Device</option>
                            <option value="action">Action</option>
                            <option value="created_at">Datetime</option>
                        </select>
                    </div>
                    <div className="col-3">
                        <button onClick={() => {
                            setSearchBy(temp1.trim());
                            setSearchValue(temp2.trim());
                        }} className="btn btn-primary py-2 px-4 ">Search</button>
                    </div>
                </div>

                <div className="row mt-5 text-center">
                    <table className="table">
                        <thead className="table-dark">
                            <tr>
                                <th scope="col">ID
                                    <span type="button">
                                        <svg
                                            onClick={() => {
                                                handleSortBy("id");
                                            }}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 640 640"
                                            width="24"
                                            height="24"
                                            fill="currentColor"
                                            style={{ verticalAlign: 'middle' }}
                                            aria-label="Sort icon"
                                            role="img"
                                        >
                                            {/* Font Awesome Free v7.0.1 by @fontawesome */}
                                            <path d="M130.4 268.2C135.4 280.2 147 288 160 288L480 288C492.9 288 504.6 280.2 509.6 268.2C514.6 256.2 511.8 242.5 502.7 233.3L342.7 73.3C330.2 60.8 309.9 60.8 297.4 73.3L137.4 233.3C128.2 242.5 125.5 256.2 130.5 268.2zM130.4 371.7C125.4 383.7 128.2 397.4 137.3 406.6L297.3 566.6C309.8 579.1 330.1 579.1 342.6 566.6L502.6 406.6C511.8 397.4 514.5 383.7 509.5 371.7C504.5 359.7 492.9 352 480 352L160 352C147.1 352 135.4 359.8 130.4 371.8z" />
                                        </svg>
                                    </span>
                                </th>
                                <th scope="col">Device
                                    <span type="button">
                                        <svg
                                            onClick={() => {
                                                handleSortBy("device");
                                            }}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 640 640"
                                            width="24"
                                            height="24"
                                            fill="currentColor"
                                            style={{ verticalAlign: 'middle' }}
                                            aria-label="Sort icon"
                                            role="img"
                                        >
                                            {/* Font Awesome Free v7.0.1 by @fontawesome */}
                                            <path d="M130.4 268.2C135.4 280.2 147 288 160 288L480 288C492.9 288 504.6 280.2 509.6 268.2C514.6 256.2 511.8 242.5 502.7 233.3L342.7 73.3C330.2 60.8 309.9 60.8 297.4 73.3L137.4 233.3C128.2 242.5 125.5 256.2 130.5 268.2zM130.4 371.7C125.4 383.7 128.2 397.4 137.3 406.6L297.3 566.6C309.8 579.1 330.1 579.1 342.6 566.6L502.6 406.6C511.8 397.4 514.5 383.7 509.5 371.7C504.5 359.7 492.9 352 480 352L160 352C147.1 352 135.4 359.8 130.4 371.8z" />
                                        </svg>
                                    </span>
                                </th>
                                <th scope="col">Action
                                    <span type="button">
                                        <svg
                                            onClick={() => {
                                                handleSortBy("action");
                                            }}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 640 640"
                                            width="24"
                                            height="24"
                                            fill="currentColor"
                                            style={{ verticalAlign: 'middle' }}
                                            aria-label="Sort icon"
                                            role="img"
                                        >
                                            {/* Font Awesome Free v7.0.1 by @fontawesome */}
                                            <path d="M130.4 268.2C135.4 280.2 147 288 160 288L480 288C492.9 288 504.6 280.2 509.6 268.2C514.6 256.2 511.8 242.5 502.7 233.3L342.7 73.3C330.2 60.8 309.9 60.8 297.4 73.3L137.4 233.3C128.2 242.5 125.5 256.2 130.5 268.2zM130.4 371.7C125.4 383.7 128.2 397.4 137.3 406.6L297.3 566.6C309.8 579.1 330.1 579.1 342.6 566.6L502.6 406.6C511.8 397.4 514.5 383.7 509.5 371.7C504.5 359.7 492.9 352 480 352L160 352C147.1 352 135.4 359.8 130.4 371.8z" />
                                        </svg>
                                    </span>
                                </th>
                                <th scope="col">Time
                                    <span type="button">
                                        <svg
                                            onClick={() => {
                                                handleSortBy("created_at");
                                            }}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 640 640"
                                            width="24"
                                            height="24"
                                            fill="currentColor"
                                            style={{ verticalAlign: 'middle' }}
                                            aria-label="Sort icon"
                                            role="img"
                                        >
                                            {/* Font Awesome Free v7.0.1 by @fontawesome */}
                                            <path d="M130.4 268.2C135.4 280.2 147 288 160 288L480 288C492.9 288 504.6 280.2 509.6 268.2C514.6 256.2 511.8 242.5 502.7 233.3L342.7 73.3C330.2 60.8 309.9 60.8 297.4 73.3L137.4 233.3C128.2 242.5 125.5 256.2 130.5 268.2zM130.4 371.7C125.4 383.7 128.2 397.4 137.3 406.6L297.3 566.6C309.8 579.1 330.1 579.1 342.6 566.6L502.6 406.6C511.8 397.4 514.5 383.7 509.5 371.7C504.5 359.7 492.9 352 480 352L160 352C147.1 352 135.4 359.8 130.4 371.8z" />
                                        </svg>
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataActionHistory && dataActionHistory.map((item) => {
                                return (<>
                                    <tr key={item.id}>
                                        <th scope="row">{item.id}</th>
                                        <td>{item.device}</td>
                                        <td>{item.action}</td>
                                        <td>  {new Date(item.created_at).toLocaleString('vi-VN', {
                                            timeZone: 'Asia/Ho_Chi_Minh',
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        })}</td>
                                    </tr>
                                </>)
                            })}

                        </tbody>
                    </table>
                </div>
                <div className="row  d-flex justify-content-center align-items-center">
                    <div className="col-4">
                        <Stack
                            spacing={4}
                            sx={{
                                backgroundColor: 'black',
                                display: 'flex',
                                justifyContent: 'center',  // căn giữa theo chiều ngang
                                alignItems: 'center',      // căn giữa theo chiều dọc nếu có chiều cao
                                // ví dụ để có chiều cao cho căn giữa dọc
                            }}
                        >
                            <Pagination
                                count={Math.ceil(number / 10)}
                                page={page}
                                variant="outlined"
                                shape="rounded"
                                onChange={(event, value) => {
                                    handlePage(value)
                                    console.log(value);
                                }}
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        color: 'white',           // chữ trắng
                                        // viền trắng
                                    },
                                    '& .Mui-selected': {
                                        backgroundColor: 'white',
                                        color: 'blue',
                                    },
                                }}
                            />
                        </Stack>
                    </div>
                </div>
            </div>


        </div>
    </>);
}
export default ActionHistory;