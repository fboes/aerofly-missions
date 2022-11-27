@echo off

set /p DIRECTION="Start-up direction [000]: "
set /p ILS="ILS frequency   [000.00]: "

pushd "%userprofile%\Documents\Aerofly FS 4"
call aerofly-missions --direction %DIRECTION% --ils %ILS% --sky-vector --flightplan"

echo " "
pause
popd
