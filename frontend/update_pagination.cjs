const fs = require('fs');
const path = require('path');

function updateAdmin(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // State
    content = content.replace(
        "const [tab, setTab] = useState('dashboard');",
        "const [tab, setTab] = useState('dashboard');\n  const [currentPage, setCurrentPage] = useState(1);"
    );
    
    // Effects & Helper
    const helperCode = `  useEffect(() => { loadData(); setCurrentPage(1); }, [tab]);
  useEffect(() => { setCurrentPage(1); }, [doctorFilters, patientFilters, appointmentFilters, paymentFilters]);

  const renderPagination = (items) => {
    const totalPages = Math.ceil(items.length / 10);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg border border-white/10 cursor-pointer text-[13px] hover:bg-white/10 disabled:opacity-50 transition-all">Previous</button>
        <span className="text-[13px] text-gray-400">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg border border-white/10 cursor-pointer text-[13px] hover:bg-white/10 disabled:opacity-50 transition-all">Next</button>
      </div>
    );
  };`;
    content = content.replace("  useEffect(() => { loadData(); setCurrentPage(1); }, [tab]);", helperCode); // if already replaced once?
    if (!content.includes("const renderPagination")) { // safe fallback
       content = content.replace("  useEffect(() => { loadData(); }, [tab]);", helperCode);
    }

    // Replacements
    const sections = [
        ['filteredDoctors', 'doctors.length'],
        ['filteredPatients', 'patients.length'],
        ['filteredAppointments', 'appointments.length'],
        ['filteredPayments', 'payments.length'],
    ];

    for (let [arrName, origLength] of sections) {
        content = content.replace(
            new RegExp(`${arrName}\\.slice\\(0, 10\\)`, 'g'), 
            `${arrName}.slice((currentPage - 1) * 10, currentPage * 10)`
        );
        
        let searchShowing = `Showing {Math.min(${arrName}.length, 10)} of {${origLength}}`;
        let replaceShowing = `Showing {${arrName}.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, ${arrName}.length)} of {${arrName}.length}`;
        content = content.replace(searchShowing, replaceShowing);

        // find map end
        let mapEndStr = `                  </div>\n                ))}`;
        let mapEndReplace = `                  </div>\n                ))}\n                {renderPagination(${arrName})}`;
        content = content.replace(mapEndStr, mapEndReplace);
    }

    // refundRequests
    content = content.replace(
        /refundRequests\.slice\(0, 10\)/g, 
        "refundRequests.slice((currentPage - 1) * 10, currentPage * 10)"
    );
    content = content.replace(
        "Showing {Math.min(refundRequests.length, 10)} refund request(s)",
        "Showing {refundRequests.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, refundRequests.length)} of {refundRequests.length} refund request(s)"
    );
    content = content.replace(
        "                    </div>\n                  </div>\n                ))}",
        "                    </div>\n                  </div>\n                ))}\n                {renderPagination(refundRequests)}"
    );

    fs.writeFileSync(filePath, content, 'utf8');
}

function updateDoctor(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // State
    content = content.replace(
        "const [tab, setTab] = useState('overview');",
        "const [tab, setTab] = useState('overview');\n  const [currentPage, setCurrentPage] = useState(1);"
    );
    
    const helperCode = `  useEffect(() => { loadData(); }, []);

  useEffect(() => { setCurrentPage(1); }, [tab, appointmentFilters, patientReportSearch, availabilityFilters, prescriptionSearch]);

  const renderPagination = (items) => {
    const totalPages = Math.ceil(items.length / 10);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#e8edf2]">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white text-[#4a5568] rounded-lg border border-[#d0d8e0] cursor-pointer text-[13px] hover:bg-[#f8fbfd] disabled:opacity-50 transition-all">Previous</button>
        <span className="text-[13px] text-[#6b7b8d]">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white text-[#4a5568] rounded-lg border border-[#d0d8e0] cursor-pointer text-[13px] hover:bg-[#f8fbfd] disabled:opacity-50 transition-all">Next</button>
      </div>
    );
  };`;
    content = content.replace("  useEffect(() => { loadData(); }, []);", helperCode);

    const sections = [
        ['filteredAppointments', 'appointments.length'],
        ['filteredPatientReports', 'patientReports.length'],
    ];

    for (let [arrName, origLength] of sections) {
        content = content.replace(
            new RegExp(`${arrName}\\.slice\\(0, 10\\)`, 'g'), 
            `${arrName}.slice((currentPage - 1) * 10, currentPage * 10)`
        );
        let searchShowing = `Showing {Math.min(${arrName}.length, 10)} of {${origLength}}`;
        let replaceShowing = `Showing {${arrName}.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, ${arrName}.length)} of {${arrName}.length}`;
        content = content.replace(searchShowing, replaceShowing);

        if (arrName === 'filteredPatientReports') {
            content = content.replace(
                "                    </div>\n                  ))}",
                `                    </div>\n                  ))}\n                  {renderPagination(${arrName})}`
            );
        } else {
            content = content.replace(
                "                    </div>\n                  )\n                }",
                `                    </div>\n                  )\n                }\n                {renderPagination(${arrName})}`
            );
        }
    }

    let arrName = 'filteredAvailability';
    content = content.replace(new RegExp(`${arrName}\\.slice\\(0, 10\\)`, 'g'), `${arrName}.slice((currentPage - 1) * 10, currentPage * 10)`);
    content = content.replace(
        `Showing {Math.min(${arrName}.length, 10)} of {availability.length} slots`,
        `Showing {${arrName}.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, ${arrName}.length)} of {${arrName}.length} slots`
    );
    content = content.replace(
        "                    </div>\n                  ))}\n                </div>",
        `                    </div>\n                  ))}\n                </div>\n                {renderPagination(${arrName})}`
    );

    arrName = 'filteredPrescriptions';
    content = content.replace(new RegExp(`${arrName}\\.slice\\(0, 10\\)`, 'g'), `${arrName}.slice((currentPage - 1) * 10, currentPage * 10)`);
    content = content.replace(
        `Showing {Math.min(${arrName}.length, 10)} of {prescriptions.length} prescriptions`,
        `Showing {${arrName}.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, ${arrName}.length)} of {${arrName}.length} prescriptions`
    );
    content = content.replace(
        "                    </div>\n                  ))}\n                </div>",
        `                    </div>\n                  ))}\n                </div>\n                {renderPagination(${arrName})}` // only first match will be caught, so maybe handle carefully but there are two. Let's precise:
    );

    fs.writeFileSync(filePath, content, 'utf8');
}

function updatePatient(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(
        "const [tab, setTab] = useState('overview');",
        "const [tab, setTab] = useState('overview');\n  const [currentPage, setCurrentPage] = useState(1);"
    );

    const helperCode = `  useEffect(() => { loadData(); }, []);

  useEffect(() => { setCurrentPage(1); }, [tab, appointmentFilters, prescriptionSearch, historyFilters, reportSearch]);

  const renderPagination = (items) => {
    const totalPages = Math.ceil(items.length / 10);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#e8edf2]">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white text-[#4a5568] rounded-lg border border-[#d0d8e0] cursor-pointer text-[13px] hover:bg-[#f8fbfd] disabled:opacity-50 transition-all">Previous</button>
        <span className="text-[13px] text-[#6b7b8d]">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white text-[#4a5568] rounded-lg border border-[#d0d8e0] cursor-pointer text-[13px] hover:bg-[#f8fbfd] disabled:opacity-50 transition-all">Next</button>
      </div>
    );
  };`;
    content = content.replace("  useEffect(() => { loadData(); }, []);", helperCode);

    let arrName = 'filteredAppointments';
    content = content.replace(new RegExp(`${arrName}\\.slice\\(0, 10\\)`, 'g'), `${arrName}.slice((currentPage - 1) * 10, currentPage * 10)`);
    content = content.replace(
        `Showing {Math.min(${arrName}.length, 10)} of {appointments.length} appointments`,
        `Showing {${arrName}.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, ${arrName}.length)} of {${arrName}.length} appointments`
    );
    content = content.replace(
        "                      </div>\n                    </div>\n                  )\n                }",
        `                      </div>\n                    </div>\n                  )\n                }\n                {renderPagination(${arrName})}`
    );

    arrName = 'filteredPrescriptions';
    content = content.replace(new RegExp(`${arrName}\\.slice\\(0, 10\\)`, 'g'), `${arrName}.slice((currentPage - 1) * 10, currentPage * 10)`);
    content = content.replace(
        `Showing {Math.min(${arrName}.length, 10)} of {prescriptions.length} prescriptions`,
        `Showing {${arrName}.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, ${arrName}.length)} of {${arrName}.length} prescriptions`
    );
    content = content.replace(
        "                    {rx.notes && <p className=\"text-[12.5px] text-[#6b7b8d] mt-2\">{rx.notes}</p>}\n                  </div>\n                ))}",
        `                    {rx.notes && <p className="text-[12.5px] text-[#6b7b8d] mt-2">{rx.notes}</p>}\n                  </div>\n                ))}\n                {renderPagination(${arrName})}`
    );

    arrName = 'filteredHistoryItems';
    content = content.replace(new RegExp(`${arrName}\\.slice\\(0, 10\\)`, 'g'), `${arrName}.slice((currentPage - 1) * 10, currentPage * 10)`);
    content = content.replace(
        `Showing {Math.min(${arrName}.length, 10)} of {historyItems.length} history items`,
        `Showing {${arrName}.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, ${arrName}.length)} of {${arrName}.length} history items`
    );
    content = content.replace(
        "                      </div>\n                    ))}\n                  </div>\n                )}",
        `                      </div>\n                    ))}\n                  </div>\n                )}\n                {renderPagination(${arrName})}`
    );

    arrName = 'filteredReports';
    content = content.replace(new RegExp(`${arrName}\\.slice\\(0, 10\\)`, 'g'), `${arrName}.slice((currentPage - 1) * 10, currentPage * 10)`);
    content = content.replace(
        `Showing {Math.min(${arrName}.length, 10)} of {reports.length} reports`,
        `Showing {${arrName}.length > 0 ? (currentPage - 1) * 10 + 1 : 0} - {Math.min(currentPage * 10, ${arrName}.length)} of {${arrName}.length} reports`
    );
    content = content.replace(
        "                        <a href={r.fileUrl} target=\"_blank\" rel=\"noreferrer\" className=\"px-4 py-1.5 bg-[#f0f7fc] text-[#1a6fa0] rounded-lg text-[13px] font-medium no-underline hover:bg-[#1a6fa0] hover:text-white transition-all\">View</a>\n                      </div>\n                    )\n                  }",
        `                        <a href={r.fileUrl} target="_blank" rel="noreferrer" className="px-4 py-1.5 bg-[#f0f7fc] text-[#1a6fa0] rounded-lg text-[13px] font-medium no-underline hover:bg-[#1a6fa0] hover:text-white transition-all">View</a>\n                      </div>\n                    )\n                  }\n                  {renderPagination(${arrName})}`
    );

    fs.writeFileSync(filePath, content, 'utf8');
}

const basePath = "c:/Projects/MediConnect/frontend/src/pages/";
updateAdmin(path.join(basePath, "AdminDashboardPage.jsx"));
updateDoctor(path.join(basePath, "DoctorDashboardPage.jsx"));
updatePatient(path.join(basePath, "PatientDashboardPage.jsx"));

console.log("Done");
